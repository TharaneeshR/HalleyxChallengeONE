package com.halleyx.workflow.dto;

import com.halleyx.workflow.enums.StepType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class StepResponse {
    private String id;
    private String workflowId;
    private String name;
    private StepType stepType;
    private Integer order;
    private String metadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RuleResponse> rules;
}
