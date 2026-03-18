package com.halleyx.workflow.dto;

import lombok.Data;
import java.util.Map;

@Data
public class ExecutionRequest {
    private Map<String, Object> data;
    private String triggeredBy;
}
