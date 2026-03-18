package com.halleyx.workflow.repository;

import com.halleyx.workflow.entity.Execution;
import com.halleyx.workflow.enums.ExecutionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, String> {

    @Query("SELECT e FROM Execution e WHERE (:workflowId IS NULL OR e.workflowId = :workflowId) AND (:status IS NULL OR e.status = :status)")
    Page<Execution> findAllWithFilters(@Param("workflowId") String workflowId,
                                       @Param("status") ExecutionStatus status,
                                       Pageable pageable);
}
