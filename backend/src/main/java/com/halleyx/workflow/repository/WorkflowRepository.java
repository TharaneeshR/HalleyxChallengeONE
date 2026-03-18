package com.halleyx.workflow.repository;

import com.halleyx.workflow.entity.Workflow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, String> {

    @Query("SELECT w FROM Workflow w WHERE (:search IS NULL OR LOWER(w.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND (:isActive IS NULL OR w.isActive = :isActive)")
    Page<Workflow> findAllWithFilters(@Param("search") String search,
                                      @Param("isActive") Boolean isActive,
                                      Pageable pageable);
}
