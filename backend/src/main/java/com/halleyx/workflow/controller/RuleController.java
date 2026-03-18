package com.halleyx.workflow.controller;

import com.halleyx.workflow.dto.RuleRequest;
import com.halleyx.workflow.dto.RuleResponse;
import com.halleyx.workflow.service.RuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RuleController {

    private final RuleService ruleService;

    @PostMapping("/api/steps/{stepId}/rules")
    public ResponseEntity<RuleResponse> create(
            @PathVariable String stepId,
            @Valid @RequestBody RuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ruleService.create(stepId, request));
    }

    @GetMapping("/api/steps/{stepId}/rules")
    public ResponseEntity<List<RuleResponse>> listByStep(@PathVariable String stepId) {
        return ResponseEntity.ok(ruleService.listByStep(stepId));
    }

    @PutMapping("/api/rules/{id}")
    public ResponseEntity<RuleResponse> update(
            @PathVariable String id,
            @Valid @RequestBody RuleRequest request) {
        return ResponseEntity.ok(ruleService.update(id, request));
    }

    @DeleteMapping("/api/rules/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        ruleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
