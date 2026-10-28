# PrivacyLens — Algorithmic Specification & Pseudocode

## 1. Multi-Signal Detection Algorithm

```text
ALGORITHM: ScanColumnForPersonalData
INPUT:
    column_name: string
    sample_values: list of strings (non-null, sanitized)
    rules_config: configuration loaded from rules.yaml
OUTPUT:
    DetectionCandidate or NULL

BEGIN
    threshold ← rules_config.candidate_confidence_threshold
    best_candidate ← NULL
    highest_confidence ← 0.0

    FOR EACH class_name, class_def IN rules_config.classes DO
        // Step 1: Evaluate Column Signal
        col_matched ← FALSE
        FOR EACH pattern IN class_def.column_patterns DO
            IF RegexMatch(pattern, column_name) THEN
                col_matched ← TRUE
                BREAK
            END IF
        END FOR

        neg_col_matched ← FALSE
        FOR EACH neg_pattern IN class_def.negative_column_patterns DO
            IF RegexMatch(neg_pattern, column_name) THEN
                neg_col_matched ← TRUE
                BREAK
            END IF
        END FOR

        IF neg_col_matched THEN
            col_score ← 0.0   // Invalidate column score on negative match
        ELSE IF col_matched THEN
            col_score ← 1.0
        ELSE
            col_score ← 0.0
        END IF

        // Step 2: Evaluate Value Pattern Match Ratio
        total_samples ← Length(sample_values)
        val_matches ← 0
        IF total_samples > 0 THEN
            FOR EACH val IN sample_values DO
                FOR EACH v_pat IN class_def.value_patterns DO
                    IF RegexMatch(v_pat, val) THEN
                        val_matches ← val_matches + 1
                        BREAK
                    END IF
                END FOR
            END FOR
            val_ratio ← val_matches / total_samples
        ELSE
            val_ratio ← 0.0
        END IF

        // Step 3: Evaluate Format & Plausibility Validator
        valid_count ← 0
        validator_func ← GetValidatorFunction(class_def.validator)
        IF validator_func ≠ NULL AND total_samples > 0 THEN
            FOR EACH val IN sample_values DO
                (is_valid, note) ← validator_func(val)
                IF is_valid THEN
                    valid_count ← valid_count + 1
                END IF
            END FOR
            valid_ratio ← valid_count / total_samples
        ELSE
            valid_ratio ← val_ratio
        END IF

        // Step 4: Transparent Multi-Signal Confidence Score
        W_col ← class_def.scoring.column_weight
        W_val ← class_def.scoring.value_weight
        W_fmt ← class_def.scoring.validator_bonus

        combined_score ← (col_score * W_col) + (val_ratio * W_val) + (valid_ratio * W_fmt)

        // Guardrails against False Positives
        IF neg_col_matched THEN
            combined_score ← MIN(combined_score, 0.35)
        END IF

        IF total_samples ≥ 3 AND val_ratio = 0.0 AND col_score > 0 THEN
            combined_score ← MIN(combined_score, 0.40)
        END IF

        IF col_score = 0.0 AND val_ratio < 0.50 THEN
            combined_score ← MIN(combined_score, 0.45)
        END IF

        // Step 5: Selection of Best Scoring Candidate
        IF combined_score ≥ threshold AND combined_score > highest_confidence THEN
            highest_confidence ← combined_score
            masked_samples ← MaskSampleValues(class_name, sample_values[0..5])
            evidence_summary ← FormatEvidenceSummary(column_name, col_matched, val_matches, total_samples, valid_count)
            signals_breakdown ← {
                column_matched: col_matched,
                column_score: col_score,
                negative_column_match: neg_col_matched,
                value_match_ratio: val_ratio,
                validator_pass_ratio: valid_ratio,
                samples_evaluated: total_samples,
                samples_matched: val_matches
            }

            best_candidate ← NEW DetectionCandidate(
                column_name: column_name,
                candidate_class: class_name,
                confidence_score: combined_score,
                evidence_summary: evidence_summary,
                signals_breakdown: signals_breakdown,
                sampled_count: total_samples,
                match_count: val_matches,
                sample_values_masked: masked_samples
            )
        END IF
    END FOR

    RETURN best_candidate
END
```

---

## 2. Compound Metadata Mapping Algorithm

```text
ALGORITHM: MatchMetadataRecord
INPUT:
    dataset_name: string
    table_name: string
    column_name: string
    database: Session
OUTPUT:
    (matched_record, status_string)

BEGIN
    // Step 1: Exact Compound Triple Match
    exact_matches ← QueryMetadata(
        dataset_name = dataset_name AND
        table_name = table_name AND
        column_name = column_name
    )
    IF Length(exact_matches) = 1 THEN
        record ← exact_matches[0]
        status ← ComputeMetadataStatus(record)
        RETURN (record, status)
    ELSE IF Length(exact_matches) > 1 THEN
        RETURN (NULL, "Ambiguous metadata match")
    END IF

    // Step 2: Table + Column Compound Match
    IF table_name ≠ "" THEN
        table_matches ← QueryMetadata(
            table_name = table_name AND
            column_name = column_name
        )
        IF Length(table_matches) = 1 THEN
            record ← table_matches[0]
            status ← ComputeMetadataStatus(record)
            RETURN (record, status)
        ELSE IF Length(table_matches) > 1 THEN
            RETURN (NULL, "Ambiguous metadata match")
        END IF
    END IF

    // Step 3: Column Match (Only permitted if globally unique)
    col_matches ← QueryMetadata(column_name = column_name)
    IF Length(col_matches) = 1 AND col_matches[0].dataset_name = "" AND col_matches[0].table_name = "" THEN
        record ← col_matches[0]
        status ← ComputeMetadataStatus(record)
        RETURN (record, status)
    ELSE IF Length(col_matches) > 1 THEN
        RETURN (NULL, "Ambiguous metadata match")
    END IF

    // No metadata registered for this candidate field
    RETURN (NULL, "Missing both")
END

FUNCTION ComputeMetadataStatus(record)
BEGIN
    has_purpose ← record.declared_purpose ≠ NULL AND Trim(record.declared_purpose) ≠ ""
    has_retention ← record.retention_period ≠ NULL AND Trim(record.retention_period) ≠ ""

    IF has_purpose AND has_retention THEN
        RETURN "Complete metadata"
    ELSE IF has_purpose AND NOT has_retention THEN
        RETURN "Missing retention"
    ELSE IF NOT has_purpose AND has_retention THEN
        RETURN "Missing purpose"
    ELSE
        RETURN "Missing both"
    END IF
END
```

---

## 3. Evaluation Metrics Formulation

For each class $c \in \{\text{person\_name}, \text{email\_address}, \text{phone\_number}, \text{government\_id}, \text{date\_of_birth}\}$:

$$\text{Precision}_c = \begin{cases} \frac{\text{TP}_c}{\text{TP}_c + \text{FP}_c} & \text{if } \text{TP}_c + \text{FP}_c > 0 \\ 0.0 & \text{otherwise (documented zero-denominator convention)} \end{cases}$$

$$\text{Recall}_c = \begin{cases} \frac{\text{TP}_c}{\text{TP}_c + \text{FN}_c} & \text{if } \text{TP}_c + \text{FN}_c > 0 \\ 0.0 & \text{otherwise} \end{cases}$$

$$\text{F1}_c = \begin{cases} 2 \times \frac{\text{Precision}_c \times \text{Recall}_c}{\text{Precision}_c + \text{Recall}_c} & \text{if } \text{Precision}_c + \text{Recall}_c > 0 \\ 0.0 & \text{otherwise} \end{cases}$$

Macro Metrics across $K = 5$ classes:
$$\text{Macro Precision} = \frac{1}{K} \sum_{c=1}^K \text{Precision}_c, \quad \text{Macro Recall} = \frac{1}{K} \sum_{c=1}^K \text{Recall}_c, \quad \text{Macro F1} = \frac{1}{K} \sum_{c=1}^K \text{F1}_c$$
