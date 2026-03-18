package com.halleyx.workflow.controller;

import com.halleyx.workflow.dto.StepRequest;
import com.halleyx.workflow.dto.StepResponse;
import com.halleyx.workflow.service.StepService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class StepController {

    private final StepService stepService;

    @PostMapping("/api/workflows/{workflowId}/steps")
    public ResponseEntity<StepResponse> create(
            @PathVariable String workflowId,
            @Valid @RequestBody StepRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stepService.create(workflowId, request));
    }

    @GetMapping("/api/workflows/{workflowId}/steps")
    public ResponseEntity<List<StepResponse>> listByWorkflow(@PathVariable String workflowId) {
        return ResponseEntity.ok(stepService.listByWorkflow(workflowId));
    }

    @GetMapping("/api/steps/{id}")
    public ResponseEntity<StepResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(stepService.getById(id));
    }

    @PutMapping("/api/steps/{id}")
    public ResponseEntity<StepResponse> update(
            @PathVariable String id,
            @Valid @RequestBody StepRequest request) {
        return ResponseEntity.ok(stepService.update(id, request));
    }

    @DeleteMapping("/api/steps/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        stepService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
