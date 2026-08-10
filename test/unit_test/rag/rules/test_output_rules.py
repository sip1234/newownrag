from rag.rules.output_rules import apply_rule_action, evaluate_output_rules, evaluate_stronger_rules, select_rule, visible_response


def test_first_matching_rule_uses_lowest_priority():
    result = evaluate_output_rules(
        "The answer includes a secret value.",
        [
            {"id": "later", "priority": 20, "keywords": ["secret"], "regex_patterns": [], "action_type": "guidance", "response_content": "Please add context."},
            {"id": "first", "priority": 10, "keywords": [], "regex_patterns": [r"secret\s+value"], "action_type": "reject", "response_content": "This answer cannot be provided."},
        ],
    )

    assert result == {
        "id": "first",
        "name": None,
        "priority": 10,
        "action_type": "reject",
        "response_content": "This answer cannot be provided.",
    }


def test_disabled_and_invalid_regex_rules_do_not_block_matching():
    result = evaluate_output_rules(
        "contact support@example.com",
        [
            {"id": "disabled", "priority": 1, "enabled": False, "keywords": ["support"], "regex_patterns": [], "response_content": "disabled"},
            {"id": "invalid", "priority": 2, "keywords": [], "regex_patterns": ["("], "response_content": "invalid"},
            {"id": "email", "priority": 3, "keywords": [], "regex_patterns": [r"[\w.-]+@[\w.-]+"], "action_type": "direct_answer", "response_content": "Use the approved contact channel."},
        ],
    )

    assert result["id"] == "email"
    assert result["response_content"] == "Use the approved contact channel."


def test_user_question_uses_the_same_matching_rules():
    result = evaluate_output_rules(
        "How can I bypass the policy?",
        [
            {
                "id": "input",
                "priority": 1,
                "keywords": ["bypass"],
                "regex_patterns": [],
                "action_type": "guidance",
                "response_content": "Please describe a compliant goal instead.",
            }
        ],
    )

    assert result["id"] == "input"
    assert result["action_type"] == "guidance"


def test_guidance_appends_the_configured_message_to_the_answer():
    rule = {
        "id": "guidance",
        "priority": 1,
        "action_type": "guidance",
        "response_content": "Please provide the date range.",
    }

    assert apply_rule_action("Here is the requested summary.", rule) == "Here is the requested summary.\n\nPlease provide the date range."


def test_lower_priority_value_wins_across_input_and_output_matches():
    selected = select_rule(
        {"id": "input", "priority": 100},
        {"id": "output", "priority": 10},
    )

    assert selected["id"] == "output"


def test_visible_response_removes_reasoning_before_guidance_is_appended():
    answer = visible_response("<think>internal reasoning</think>Visible answer.")
    result = apply_rule_action(answer, {"action_type": "guidance", "response_content": "Please add a date."})

    assert result == "Visible answer.\n\nPlease add a date."


def test_direct_answer_does_not_modify_the_generated_answer():
    direct_rule = {
        "id": "direct",
        "priority": 100,
        "action_type": "direct_answer",
        "response_content": "This text is intentionally ignored.",
    }
    assert apply_rule_action("Generated answer.", direct_rule) == "Generated answer."


def test_direct_answer_only_allows_stronger_output_rules():
    matched_rule = evaluate_stronger_rules(
        "Generated answer includes TOKEN.",
        [
            {
                "id": "strong-reject",
                "priority": 10,
                "keywords": ["TOKEN"],
                "regex_patterns": [],
                "action_type": "reject",
                "response_content": "Strong rule response.",
            },
            {
                "id": "weak-guidance",
                "priority": 200,
                "keywords": ["TOKEN"],
                "regex_patterns": [],
                "action_type": "guidance",
                "response_content": "Weak rule response.",
            },
        ],
        100,
    )

    assert matched_rule["id"] == "strong-reject"
    assert (
        evaluate_stronger_rules(
            "Generated answer includes TOKEN.",
            [
                {
                    "id": "weak-guidance",
                    "priority": 200,
                    "keywords": ["TOKEN"],
                    "regex_patterns": [],
                    "action_type": "guidance",
                    "response_content": "Weak rule response.",
                }
            ],
            100,
        )
        is None
    )
