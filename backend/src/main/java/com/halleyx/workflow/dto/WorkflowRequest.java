package com.halleyx.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WorkflowRequest {
    @NotBlank(message = "Workflow name is required")
    private String name;
    private String description;
    private String inputSchema; // JSON string
    private String startStepId;
    private Boolean isActive;
}
