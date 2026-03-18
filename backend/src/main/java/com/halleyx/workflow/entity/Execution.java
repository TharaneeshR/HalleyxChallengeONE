package com.halleyx.workflow.entity;

import com.halleyx.workflow.enums.ExecutionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "executions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Execution {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "workflow_id", nullable = false, length = 36)
    private String workflowId;

    @Column(name = "workflow_version")
    private Integer workflowVersion;

    @Column(name = "workflow_name")
    private String workflowName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExecutionStatus status;

    // Store JSON as TEXT; parsed in service layer
    @Column(columnDefinition = "TEXT")
    private String data;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String logs;

    @Column(name = "current_step_id", length = 36)
    private String currentStepId;

    @Column(name = "current_step_name")
    private String currentStepName;

    @Column
    private Integer retries;

    @Column(name = "triggered_by")
    private String triggeredBy;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @PrePersist
    public void prePersist() {
        if (id == null)      id      = UUID.randomUUID().toString();
        if (retries == null) retries = 0;
        if (status == null)  status  = ExecutionStatus.PENDING;
        if (logs == null)    logs    = "[]";
    }
}
