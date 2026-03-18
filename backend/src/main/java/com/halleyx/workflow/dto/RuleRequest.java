package com.halleyx.workflow.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RuleRequest {
    @NotBlank(message = "Condition is required")
    private String condition;

    private String nextStepId; // null = end workflow

    @NotNull(message = "Priority is required")
    @Min(value = 1, message = "Priority must be >= 1")
    private Integer priority;
}
