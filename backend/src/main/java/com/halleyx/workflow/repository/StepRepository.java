package com.halleyx.workflow.repository;

import com.halleyx.workflow.entity.Step;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StepRepository extends JpaRepository<Step, String> {
    // Maps to the Java field name "order" (column: step_order)
    List<Step> findByWorkflowIdOrderByOrderAsc(String workflowId);
}
