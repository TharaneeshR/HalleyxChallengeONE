package com.halleyx.workflow.controller;

import com.halleyx.workflow.dto.PageResponse;
import com.halleyx.workflow.dto.WorkflowRequest;
import com.halleyx.workflow.dto.WorkflowResponse;
import com.halleyx.workflow.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @PostMapping
    public ResponseEntity<WorkflowResponse> create(@Valid @RequestBody WorkflowRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workflowService.create(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<WorkflowResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(workflowService.list(search, isActive, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowResponse> update(
            @PathVariable String id,
            @Valid @RequestBody WorkflowRequest request) {
        return ResponseEntity.ok(workflowService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        workflowService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
