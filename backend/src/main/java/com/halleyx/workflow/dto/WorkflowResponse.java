package com.halleyx.workflow.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class WorkflowResponse {
    private String id;
    private String name;
    private String description;
    private Integer version;
    private Boolean isActive;
    private String inputSchema;
    private String startStepId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<StepResponse> steps;
    private int stepCount;
}
