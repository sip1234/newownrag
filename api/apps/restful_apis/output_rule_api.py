#
#  Copyright 2026 The InfiniFlow Authors. All Rights Reserved.
#

import re

from quart import Response

from api.apps import current_user, login_required
from api.db.services.output_rule_service import OutputRuleService
from api.utils.api_utils import get_data_error_result, get_json_result, get_request_json, server_error_response
from common.misc_utils import get_uuid

ACTION_TYPES = {"reject", "guidance", "direct_answer"}
MAX_CONDITIONS = 100
MAX_CONDITION_LENGTH = 512
MAX_RESPONSE_LENGTH = 10000


def _clean_conditions(value, field_name: str):
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError(f"{field_name} must be an array.")
    if len(value) > MAX_CONDITIONS:
        raise ValueError(f"{field_name} can contain at most {MAX_CONDITIONS} items.")

    conditions = []
    for item in value:
        if not isinstance(item, str) or not item.strip():
            raise ValueError(f"Each {field_name} item must be a non-empty string.")
        item = item.strip()
        if len(item) > MAX_CONDITION_LENGTH:
            raise ValueError(f"Each {field_name} item can contain at most {MAX_CONDITION_LENGTH} characters.")
        conditions.append(item)
    return conditions


def _validate_payload(payload, existing=None):
    existing = existing or {}
    name = payload.get("name", existing.get("name", ""))
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 128:
        raise ValueError("name must be between 1 and 128 characters.")

    keywords = _clean_conditions(payload.get("keywords", existing.get("keywords", [])), "keywords")
    regex_patterns = _clean_conditions(payload.get("regex_patterns", existing.get("regex_patterns", [])), "regex_patterns")
    if not keywords and not regex_patterns:
        raise ValueError("At least one keyword or regular expression is required.")
    for pattern in regex_patterns:
        try:
            re.compile(pattern)
        except re.error as exc:
            raise ValueError(f"Invalid regular expression: {exc}") from exc

    action_type = payload.get("action_type", existing.get("action_type", ""))
    if action_type not in ACTION_TYPES:
        raise ValueError("action_type must be reject, guidance, or direct_answer.")

    response_content = payload.get("response_content", existing.get("response_content", ""))
    if not isinstance(response_content, str) or len(response_content) > MAX_RESPONSE_LENGTH:
        raise ValueError(f"response_content must be at most {MAX_RESPONSE_LENGTH} characters.")
    if action_type != "direct_answer" and not response_content.strip():
        raise ValueError(f"response_content must be between 1 and {MAX_RESPONSE_LENGTH} characters for this action.")

    priority = payload.get("priority", existing.get("priority", 100))
    if isinstance(priority, bool) or not isinstance(priority, int) or priority < 0 or priority > 1000000:
        raise ValueError("priority must be an integer between 0 and 1000000. Lower values run first.")

    enabled = payload.get("enabled", existing.get("enabled", True))
    if not isinstance(enabled, bool):
        raise ValueError("enabled must be a boolean.")

    return {
        "name": name.strip(),
        "keywords": keywords,
        "regex_patterns": regex_patterns,
        "action_type": action_type,
        "response_content": "" if action_type == "direct_answer" else response_content.strip(),
        "priority": priority,
        "enabled": enabled,
    }


@manager.route("/output-rules", methods=["GET"])  # noqa: F821
@login_required
async def list_output_rules() -> Response:
    try:
        rules = OutputRuleService.list_by_tenant(current_user.id)
        return get_json_result(data={"rules": [rule.to_dict() for rule in rules]})
    except Exception as exc:
        return server_error_response(exc)


@manager.route("/output-rules", methods=["POST"])  # noqa: F821
@login_required
async def create_output_rule() -> Response:
    try:
        payload = _validate_payload(await get_request_json())
        payload.update({"id": get_uuid(), "tenant_id": current_user.id})
        OutputRuleService.insert(**payload)
        _, rule = OutputRuleService.get_by_id(payload["id"])
        return get_json_result(data=rule.to_dict())
    except ValueError as exc:
        return get_data_error_result(message=str(exc))
    except Exception as exc:
        return server_error_response(exc)


@manager.route("/output-rules/<rule_id>", methods=["PUT"])  # noqa: F821
@login_required
async def update_output_rule(rule_id: str) -> Response:
    try:
        exists, rule = OutputRuleService.get_by_id(rule_id)
        if not exists or rule.tenant_id != current_user.id:
            return get_data_error_result(message="Output rule not found.")
        payload = _validate_payload(await get_request_json(), rule.to_dict())
        OutputRuleService.update_by_id(rule_id, payload)
        _, updated_rule = OutputRuleService.get_by_id(rule_id)
        return get_json_result(data=updated_rule.to_dict())
    except ValueError as exc:
        return get_data_error_result(message=str(exc))
    except Exception as exc:
        return server_error_response(exc)


@manager.route("/output-rules/<rule_id>", methods=["DELETE"])  # noqa: F821
@login_required
async def delete_output_rule(rule_id: str) -> Response:
    try:
        exists, rule = OutputRuleService.get_by_id(rule_id)
        if not exists or rule.tenant_id != current_user.id:
            return get_data_error_result(message="Output rule not found.")
        OutputRuleService.delete_by_id(rule_id)
        return get_json_result(data=True)
    except Exception as exc:
        return server_error_response(exc)
