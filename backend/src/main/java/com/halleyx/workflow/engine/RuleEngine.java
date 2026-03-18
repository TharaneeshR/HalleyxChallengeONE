package com.halleyx.workflow.engine;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.halleyx.workflow.entity.Rule;
import com.halleyx.workflow.entity.Step;
import com.halleyx.workflow.repository.RuleRepository;
import com.halleyx.workflow.repository.StepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class RuleEngine {

    private static final String DEFAULT_CONDITION = "DEFAULT";
    private final RuleRepository ruleRepository;
    private final StepRepository stepRepository;
    private final ObjectMapper objectMapper;

    /**
     * Evaluates rules for a step and returns the next step ID (null = end workflow).
     */
    public RuleEvaluationResult evaluate(String stepId, Map<String, Object> data) {
        List<Rule> rules = ruleRepository.findByStepIdOrderByPriorityAsc(stepId);

        List<RuleEvalDetail> evalDetails = new ArrayList<>();
        Rule defaultRule = null;
        Rule matchedRule = null;

        for (Rule rule : rules) {
            if (DEFAULT_CONDITION.equalsIgnoreCase(rule.getCondition().trim())) {
                defaultRule = rule;
                evalDetails.add(new RuleEvalDetail(rule.getCondition(), false, "DEFAULT (fallback)"));
                continue;
            }

            boolean result = false;
            String error = null;
            try {
                result = evaluateExpression(rule.getCondition(), data);
            } catch (Exception e) {
                error = "Eval error: " + e.getMessage();
                log.warn("Rule evaluation failed for rule {}: {}", rule.getId(), e.getMessage());
            }

            evalDetails.add(new RuleEvalDetail(rule.getCondition(), result, error));

            if (result && matchedRule == null) {
                matchedRule = rule;
            }
        }

        // Use matched rule or fall back to DEFAULT
        Rule selectedRule = matchedRule != null ? matchedRule : defaultRule;

        String nextStepId = null;
        String nextStepName = null;
        boolean endWorkflow = false;

        if (selectedRule != null) {
            nextStepId = selectedRule.getNextStepId();
            if (nextStepId == null) {
                endWorkflow = true;
                nextStepName = "END";
            } else {
                Optional<Step> nextStep = stepRepository.findById(nextStepId);
                nextStepName = nextStep.map(Step::getName).orElse("Unknown Step");
            }
            // Mark DEFAULT as matched in eval details if it's the fallback
            if (matchedRule == null && defaultRule != null) {
                evalDetails.stream()
                    .filter(d -> "DEFAULT (fallback)".equals(d.getError()))
                    .findFirst()
                    .ifPresent(d -> d.setResult(true));
            }
        } else {
            endWorkflow = true;
            nextStepName = "END (no matching rule)";
        }

        return new RuleEvaluationResult(nextStepId, nextStepName, endWorkflow, evalDetails);
    }

    /**
     * Evaluates a logical expression with custom functions and operators.
     * Supports: ==, !=, <, >, <=, >=, &&, ||, contains(), startsWith(), endsWith()
     */
    private boolean evaluateExpression(String expression, Map<String, Object> data) {
        String expr = expression.trim();

        // Preprocess: replace function calls
        expr = preprocessFunctions(expr, data);

        // Replace field names with their values
        expr = substituteValues(expr, data);

        // Evaluate the final boolean expression
        return evaluateBooleanExpression(expr);
    }

    private String preprocessFunctions(String expr, Map<String, Object> data) {
        // contains(field, "value")
        Pattern containsPattern = Pattern.compile("contains\\(([^,]+),\\s*['\"]([^'\"]*)['\"]\\)");
        Matcher m = containsPattern.matcher(expr);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String field = m.group(1).trim();
            String value = m.group(2);
            Object fieldVal = getFieldValue(field, data);
            boolean result = fieldVal != null && fieldVal.toString().toLowerCase().contains(value.toLowerCase());
            m.appendReplacement(sb, result ? "true" : "false");
        }
        m.appendTail(sb);
        expr = sb.toString();

        // startsWith(field, "value")
        Pattern startsPattern = Pattern.compile("startsWith\\(([^,]+),\\s*['\"]([^'\"]*)['\"]\\)");
        m = startsPattern.matcher(expr);
        sb = new StringBuffer();
        while (m.find()) {
            String field = m.group(1).trim();
            String value = m.group(2);
            Object fieldVal = getFieldValue(field, data);
            boolean result = fieldVal != null && fieldVal.toString().startsWith(value);
            m.appendReplacement(sb, result ? "true" : "false");
        }
        m.appendTail(sb);
        expr = sb.toString();

        // endsWith(field, "value")
        Pattern endsPattern = Pattern.compile("endsWith\\(([^,]+),\\s*['\"]([^'\"]*)['\"]\\)");
        m = endsPattern.matcher(expr);
        sb = new StringBuffer();
        while (m.find()) {
            String field = m.group(1).trim();
            String value = m.group(2);
            Object fieldVal = getFieldValue(field, data);
            boolean result = fieldVal != null && fieldVal.toString().endsWith(value);
            m.appendReplacement(sb, result ? "true" : "false");
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private String substituteValues(String expr, Map<String, Object> data) {
        // Replace string comparisons: field == 'value' or field == "value"
        Pattern strComparePattern = Pattern.compile("([a-zA-Z_][a-zA-Z0-9_]*)\\s*(==|!=)\\s*['\"]([^'\"]*)['\"]");
        Matcher m = strComparePattern.matcher(expr);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String field = m.group(1);
            String op = m.group(2);
            String value = m.group(3);
            Object fieldVal = getFieldValue(field, data);
            boolean result;
            if (fieldVal == null) {
                result = op.equals("!=");
            } else {
                boolean eq = fieldVal.toString().equalsIgnoreCase(value);
                result = op.equals("==") ? eq : !eq;
            }
            m.appendReplacement(sb, result ? "true" : "false");
        }
        m.appendTail(sb);
        expr = sb.toString();

        // Replace numeric comparisons: field > 100, field <= 50.5, etc.
        Pattern numComparePattern = Pattern.compile("([a-zA-Z_][a-zA-Z0-9_]*)\\s*(==|!=|<=|>=|<|>)\\s*(-?\\d+\\.?\\d*)");
        m = numComparePattern.matcher(expr);
        sb = new StringBuffer();
        while (m.find()) {
            String field = m.group(1);
            String op = m.group(2);
            double compareVal = Double.parseDouble(m.group(3));
            Object fieldVal = getFieldValue(field, data);
            boolean result = false;
            if (fieldVal != null) {
                try {
                    double fieldNum = Double.parseDouble(fieldVal.toString());
                    result = switch (op) {
                        case "==" -> fieldNum == compareVal;
                        case "!=" -> fieldNum != compareVal;
                        case "<"  -> fieldNum < compareVal;
                        case ">"  -> fieldNum > compareVal;
                        case "<=" -> fieldNum <= compareVal;
                        case ">=" -> fieldNum >= compareVal;
                        default -> false;
                    };
                } catch (NumberFormatException e) {
                    log.warn("Cannot compare non-numeric field {} as number", field);
                }
            }
            m.appendReplacement(sb, result ? "true" : "false");
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private boolean evaluateBooleanExpression(String expr) {
        expr = expr.trim();

        // Handle parentheses
        while (expr.startsWith("(") && expr.endsWith(")") && isMatchingParens(expr)) {
            expr = expr.substring(1, expr.length() - 1).trim();
        }

        // Split on || (lowest precedence)
        int orIdx = findOperatorIndex(expr, "||");
        if (orIdx >= 0) {
            String left = expr.substring(0, orIdx).trim();
            String right = expr.substring(orIdx + 2).trim();
            return evaluateBooleanExpression(left) || evaluateBooleanExpression(right);
        }

        // Split on && (higher precedence)
        int andIdx = findOperatorIndex(expr, "&&");
        if (andIdx >= 0) {
            String left = expr.substring(0, andIdx).trim();
            String right = expr.substring(andIdx + 2).trim();
            return evaluateBooleanExpression(left) && evaluateBooleanExpression(right);
        }

        return Boolean.parseBoolean(expr);
    }

    private int findOperatorIndex(String expr, String op) {
        int depth = 0;
        for (int i = 0; i < expr.length() - op.length() + 1; i++) {
            char c = expr.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            else if (depth == 0 && expr.startsWith(op, i)) {
                return i;
            }
        }
        return -1;
    }

    private boolean isMatchingParens(String expr) {
        int depth = 0;
        for (int i = 0; i < expr.length(); i++) {
            if (expr.charAt(i) == '(') depth++;
            else if (expr.charAt(i) == ')') {
                depth--;
                if (depth == 0 && i < expr.length() - 1) return false;
            }
        }
        return depth == 0;
    }

    private Object getFieldValue(String field, Map<String, Object> data) {
        return data.get(field.trim());
    }

    // Inner result classes
    public static class RuleEvaluationResult {
        public final String nextStepId;
        public final String nextStepName;
        public final boolean endWorkflow;
        public final List<RuleEvalDetail> evalDetails;

        public RuleEvaluationResult(String nextStepId, String nextStepName, boolean endWorkflow, List<RuleEvalDetail> evalDetails) {
            this.nextStepId = nextStepId;
            this.nextStepName = nextStepName;
            this.endWorkflow = endWorkflow;
            this.evalDetails = evalDetails;
        }
    }

    public static class RuleEvalDetail {
        public final String rule;
        private boolean result;
        private final String error;

        public RuleEvalDetail(String rule, boolean result, String error) {
            this.rule = rule;
            this.result = result;
            this.error = error;
        }

        public boolean isResult() { return result; }
        public void setResult(boolean r) { this.result = r; }
        public String getError() { return error; }
        public String getRule() { return rule; }
    }
}
