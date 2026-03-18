package com.halleyx.workflow.config;

import com.halleyx.workflow.dto.*;
import com.halleyx.workflow.enums.StepType;
import com.halleyx.workflow.repository.WorkflowRepository;
import com.halleyx.workflow.service.ExecutionService;
import com.halleyx.workflow.service.RuleService;
import com.halleyx.workflow.service.StepService;
import com.halleyx.workflow.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final WorkflowRepository workflowRepository;
    private final WorkflowService workflowService;
    private final StepService stepService;
    private final RuleService ruleService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (workflowRepository.count() > 0) {
            log.info("Database already seeded. Skipping.");
            return;
        }
        log.info("Seeding sample workflows...");
        seedExpenseApproval();
        seedEmployeeOnboarding();
        log.info("Seeding complete.");
    }

    private void seedExpenseApproval() {
        // Create workflow
        WorkflowRequest wfReq = new WorkflowRequest();
        wfReq.setName("Expense Approval");
        wfReq.setDescription("Multi-level expense approval workflow with finance and CEO review");
        wfReq.setInputSchema("{\"amount\":{\"type\":\"number\",\"required\":true}," +
                "\"country\":{\"type\":\"string\",\"required\":true}," +
                "\"department\":{\"type\":\"string\",\"required\":false}," +
                "\"priority\":{\"type\":\"string\",\"required\":true,\"allowed_values\":[\"High\",\"Medium\",\"Low\"]}}");
        WorkflowResponse wf = workflowService.create(wfReq);

        // Steps
        StepRequest s1 = new StepRequest();
        s1.setName("Manager Approval"); s1.setStepType(StepType.APPROVAL); s1.setOrder(1);
        s1.setMetadata("{\"assignee_email\":\"manager@example.com\",\"instructions\":\"Review expense and approve or reject\"}");
        StepResponse step1 = stepService.create(wf.getId(), s1);

        StepRequest s2 = new StepRequest();
        s2.setName("Finance Notification"); s2.setStepType(StepType.NOTIFICATION); s2.setOrder(2);
        s2.setMetadata("{\"notification_channel\":\"email\",\"template\":\"expense_finance_alert\",\"recipients\":[\"finance@example.com\"]}");
        StepResponse step2 = stepService.create(wf.getId(), s2);

        StepRequest s3 = new StepRequest();
        s3.setName("CEO Approval"); s3.setStepType(StepType.APPROVAL); s3.setOrder(3);
        s3.setMetadata("{\"assignee_email\":\"ceo@example.com\",\"instructions\":\"Final approval for large expenses\"}");
        StepResponse step3 = stepService.create(wf.getId(), s3);

        StepRequest s4 = new StepRequest();
        s4.setName("Task Rejection"); s4.setStepType(StepType.TASK); s4.setOrder(4);
        s4.setMetadata("{\"action\":\"reject\",\"notification_channel\":\"email\",\"template\":\"expense_rejected\"}");
        StepResponse step4 = stepService.create(wf.getId(), s4);

        StepRequest s5 = new StepRequest();
        s5.setName("Task Completion"); s5.setStepType(StepType.TASK); s5.setOrder(5);
        s5.setMetadata("{\"action\":\"complete\",\"notification_channel\":\"email\",\"template\":\"expense_approved\"}");
        StepResponse step5 = stepService.create(wf.getId(), s5);

        // Set start step
        WorkflowRequest updateReq = new WorkflowRequest();
        updateReq.setName(wf.getName());
        updateReq.setDescription(wf.getDescription());
        updateReq.setInputSchema(wf.getInputSchema());
        updateReq.setStartStepId(step1.getId());
        workflowService.update(wf.getId(), updateReq);

        // Rules for Manager Approval
        RuleRequest r1 = new RuleRequest();
        r1.setCondition("amount > 100 && country == 'US' && priority == 'High'");
        r1.setNextStepId(step2.getId()); r1.setPriority(1);
        ruleService.create(step1.getId(), r1);

        RuleRequest r2 = new RuleRequest();
        r2.setCondition("amount <= 100 || department == 'HR'");
        r2.setNextStepId(step3.getId()); r2.setPriority(2);
        ruleService.create(step1.getId(), r2);

        RuleRequest r3 = new RuleRequest();
        r3.setCondition("priority == 'Low' && country != 'US'");
        r3.setNextStepId(step4.getId()); r3.setPriority(3);
        ruleService.create(step1.getId(), r3);

        RuleRequest r4 = new RuleRequest();
        r4.setCondition("DEFAULT"); r4.setNextStepId(step4.getId()); r4.setPriority(4);
        ruleService.create(step1.getId(), r4);

        // Rules for Finance Notification
        RuleRequest fn1 = new RuleRequest();
        fn1.setCondition("amount > 500"); fn1.setNextStepId(step3.getId()); fn1.setPriority(1);
        ruleService.create(step2.getId(), fn1);

        RuleRequest fn2 = new RuleRequest();
        fn2.setCondition("DEFAULT"); fn2.setNextStepId(step5.getId()); fn2.setPriority(2);
        ruleService.create(step2.getId(), fn2);

        // Rules for CEO Approval
        RuleRequest ca1 = new RuleRequest();
        ca1.setCondition("DEFAULT"); ca1.setNextStepId(step5.getId()); ca1.setPriority(1);
        ruleService.create(step3.getId(), ca1);

        // Rules for Task Rejection (end)
        RuleRequest tr1 = new RuleRequest();
        tr1.setCondition("DEFAULT"); tr1.setNextStepId(null); tr1.setPriority(1);
        ruleService.create(step4.getId(), tr1);

        // Rules for Task Completion (end)
        RuleRequest tc1 = new RuleRequest();
        tc1.setCondition("DEFAULT"); tc1.setNextStepId(null); tc1.setPriority(1);
        ruleService.create(step5.getId(), tc1);

        log.info("Seeded: Expense Approval workflow (id={})", wf.getId());
    }

    private void seedEmployeeOnboarding() {
        WorkflowRequest wfReq = new WorkflowRequest();
        wfReq.setName("Employee Onboarding");
        wfReq.setDescription("Automated employee onboarding with IT setup and HR notification");
        wfReq.setInputSchema("{\"employee_name\":{\"type\":\"string\",\"required\":true}," +
                "\"department\":{\"type\":\"string\",\"required\":true}," +
                "\"role\":{\"type\":\"string\",\"required\":true}," +
                "\"start_date\":{\"type\":\"string\",\"required\":true}}");
        WorkflowResponse wf = workflowService.create(wfReq);

        StepRequest s1 = new StepRequest();
        s1.setName("HR Notification"); s1.setStepType(StepType.NOTIFICATION); s1.setOrder(1);
        s1.setMetadata("{\"notification_channel\":\"email\",\"template\":\"new_employee_alert\",\"recipients\":[\"hr@example.com\"]}");
        StepResponse step1 = stepService.create(wf.getId(), s1);

        StepRequest s2 = new StepRequest();
        s2.setName("IT Setup Task"); s2.setStepType(StepType.TASK); s2.setOrder(2);
        s2.setMetadata("{\"action\":\"provision_accounts\",\"systems\":[\"email\",\"slack\",\"jira\"]}");
        StepResponse step2 = stepService.create(wf.getId(), s2);

        StepRequest s3 = new StepRequest();
        s3.setName("Manager Approval"); s3.setStepType(StepType.APPROVAL); s3.setOrder(3);
        s3.setMetadata("{\"assignee_email\":\"manager@example.com\",\"instructions\":\"Approve onboarding completion\"}");
        StepResponse step3 = stepService.create(wf.getId(), s3);

        StepRequest s4 = new StepRequest();
        s4.setName("Onboarding Complete"); s4.setStepType(StepType.TASK); s4.setOrder(4);
        s4.setMetadata("{\"action\":\"complete_onboarding\",\"notification_channel\":\"slack\"}");
        StepResponse step4 = stepService.create(wf.getId(), s4);

        WorkflowRequest updateReq = new WorkflowRequest();
        updateReq.setName(wf.getName());
        updateReq.setDescription(wf.getDescription());
        updateReq.setInputSchema(wf.getInputSchema());
        updateReq.setStartStepId(step1.getId());
        workflowService.update(wf.getId(), updateReq);

        // HR Notification -> IT Setup always
        RuleRequest r1 = new RuleRequest();
        r1.setCondition("DEFAULT"); r1.setNextStepId(step2.getId()); r1.setPriority(1);
        ruleService.create(step1.getId(), r1);

        // IT Setup: Engineering goes to approval, others go straight to complete
        RuleRequest r2 = new RuleRequest();
        r2.setCondition("department == 'Engineering'"); r2.setNextStepId(step3.getId()); r2.setPriority(1);
        ruleService.create(step2.getId(), r2);

        RuleRequest r3 = new RuleRequest();
        r3.setCondition("DEFAULT"); r3.setNextStepId(step4.getId()); r3.setPriority(2);
        ruleService.create(step2.getId(), r3);

        // Manager approval -> Complete
        RuleRequest r4 = new RuleRequest();
        r4.setCondition("DEFAULT"); r4.setNextStepId(step4.getId()); r4.setPriority(1);
        ruleService.create(step3.getId(), r4);

        // Onboarding Complete -> end
        RuleRequest r5 = new RuleRequest();
        r5.setCondition("DEFAULT"); r5.setNextStepId(null); r5.setPriority(1);
        ruleService.create(step4.getId(), r5);

        log.info("Seeded: Employee Onboarding workflow (id={})", wf.getId());
    }
}
