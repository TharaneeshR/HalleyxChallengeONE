package com.halleyx.workflow.controller;

import com.halleyx.workflow.dto.ExecutionRequest;
import com.halleyx.workflow.dto.ExecutionResponse;
import com.halleyx.workflow.dto.PageResponse;
import com.halleyx.workflow.enums.ExecutionStatus;
import com.halleyx.workflow.service.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService executionService;

    @PostMapping("/api/workflows/{workflowId}/execute")
    public ResponseEntity<ExecutionResponse> startExecution(
            @PathVariable String workflowId,
            @RequestBody ExecutionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(executionService.startExecution(workflowId, request));
    }

    @GetMapping("/api/executions/{id}")
    public ResponseEntity<ExecutionResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(executionService.getById(id));
    }

    @PostMapping("/api/executions/{id}/cancel")
    public ResponseEntity<ExecutionResponse> cancel(@PathVariable String id) {
        return ResponseEntity.ok(executionService.cancel(id));
    }

    @PostMapping("/api/executions/{id}/retry")
    public ResponseEntity<ExecutionResponse> retry(@PathVariable String id) {
        return ResponseEntity.ok(executionService.retry(id));
    }

    @GetMapping("/api/executions")
    public ResponseEntity<PageResponse<ExecutionResponse>> list(
            @RequestParam(required = false) String workflowId,
            @RequestParam(required = false) ExecutionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(executionService.list(workflowId, status, page, size));
    }
}
