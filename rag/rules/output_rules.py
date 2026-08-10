"""Deterministic post-generation output rules.

Rules are evaluated in ascending priority order. The first matched rule wins so
tenants can resolve overlapping conditions without relying on insertion order.
"""

import re
from collections.abc import Iterable
from typing import Any

from api.db.services.output_rule_service import OutputRuleService


def _normalized_terms(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    return [value.strip() for value in values if isinstance(value, str) and value.strip()]


def _rule_value(rule: Any, name: str, default: Any = None) -> Any:
    if isinstance(rule, dict):
        return rule.get(name, default)
    return getattr(rule, name, default)


def _matches_rule(output: str, rule: Any) -> bool:
    keywords = _normalized_terms(_rule_value(rule, "keywords", []))
    regex_patterns = _normalized_terms(_rule_value(rule, "regex_patterns", []))
    normalized_output = output.casefold()

    if any(keyword.casefold() in normalized_output for keyword in keywords):
        return True

    for pattern in regex_patterns:
        try:
            if re.search(pattern, output, flags=re.IGNORECASE):
                return True
        except re.error:
            # API validation prevents malformed expressions. Ignore corrupt
            # historical rows rather than interrupting a user response.
            continue
    return False


def evaluate_output_rules(content: str, rules: Iterable[Any]) -> dict[str, Any] | None:
    """Return the first matching enabled rule, ordered by lowest priority."""
    if not isinstance(content, str) or not content:
        return None

    ordered_rules = sorted(
        (rule for rule in rules if _rule_value(rule, "enabled", True)),
        key=lambda rule: (_rule_value(rule, "priority", 100), _rule_value(rule, "create_time", 0) or 0),
    )
    for rule in ordered_rules:
        if _matches_rule(content, rule):
            return {
                "id": _rule_value(rule, "id"),
                "name": _rule_value(rule, "name"),
                "priority": _rule_value(rule, "priority"),
                "action_type": _rule_value(rule, "action_type"),
                "response_content": _rule_value(rule, "response_content"),
            }
    return None


def select_rule(*rules: dict[str, Any] | None) -> dict[str, Any] | None:
    """Choose the highest-priority rule from independently matched stages."""
    candidates = [rule for rule in rules if rule is not None]
    if not candidates:
        return None
    return min(candidates, key=lambda rule: (rule.get("priority", 100), rule.get("id") or ""))


def evaluate_stronger_rules(content: str, rules: Iterable[Any], priority: int) -> dict[str, Any] | None:
    """Return a matching rule that is stronger than the supplied priority.

    Smaller priority values are stronger. Rules at the same or a weaker
    priority are deliberately excluded so a direct-answer rule remains final
    unless an explicitly stronger rule constrains its configured response.
    """
    return evaluate_output_rules(
        content,
        (rule for rule in rules if _rule_value(rule, "priority", 100) < priority),
    )


def apply_rule_action(answer: str, rule: dict[str, Any]) -> str:
    """Return the response visible to the user for a matched rule.

    Reject rules replace the generated answer. Guidance preserves it and
    appends the configured follow-up message. Direct-answer rules intentionally
    leave the answer unchanged: they establish a priority boundary instead of
    supplying response content.
    """
    response_content = str(rule.get("response_content") or "").strip()
    action_type = rule.get("action_type")
    if action_type == "direct_answer":
        return answer
    if action_type != "guidance":
        return response_content
    if not answer.strip():
        return response_content
    return f"{answer.rstrip()}\n\n{response_content}"


def visible_response(content: str) -> str:
    """Remove internal reasoning sections before composing a user response."""
    return re.sub(r"<think>.*?(?:</think>|$)", "", content or "", flags=re.DOTALL).strip()


def apply_output_rules(tenant_id: str, content: str, rules: Iterable[Any] | None = None) -> dict[str, Any] | None:
    """Apply active tenant rules to user input or a completed LLM output.

    Callers decide whether a matching direct-answer rule establishes a priority
    boundary before applying other actions to the generated output.
    """
    if rules is None:
        rules = OutputRuleService.list_by_tenant(tenant_id, enabled_only=True)
    return evaluate_output_rules(content, rules)
