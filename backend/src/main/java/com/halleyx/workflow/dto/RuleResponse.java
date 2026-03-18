package com.halleyx.workflow.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RuleResponse {
    private String id;
    private String stepId;
    private String condition;
    private String nextStepId;
    private String nextStepName;
    private Integer priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
