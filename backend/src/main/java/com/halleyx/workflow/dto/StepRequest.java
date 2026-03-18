package com.halleyx.workflow.dto;

import com.halleyx.workflow.enums.StepType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StepRequest {
    @NotBlank(message = "Step name is required")
    private String name;

    @NotNull(message = "Step type is required")
    private StepType stepType;

    private Integer order;
    private String metadata; // JSON string
}
