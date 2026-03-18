package com.halleyx.workflow.dto;

import com.halleyx.workflow.enums.ExecutionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ExecutionResponse {
    private String id;
    private String workflowId;
    private String workflowName;
    private Integer workflowVersion;
    private ExecutionStatus status;
    private Map<String, Object> data;
    private List<Object> logs;
    private String currentStepId;
    private String currentStepName;
    private Integer retries;
    private String triggeredBy;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}
