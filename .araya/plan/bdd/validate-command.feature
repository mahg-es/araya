# language: en
Feature: araya validate certifies a compliant ARAYA environment
  As an ARAYA operator
  I want `araya validate` to confirm that my environment is well-formed
  So that I can trust the workspace before running further commands

  # Traces to AC-001 / REQ-001
  Scenario: Validation succeeds for a compliant environment
    Given an ARAYA environment whose root contains "araya.yaml"
    And the root contains the directories ".araya/specs", ".araya/changes", ".araya/archive", and ".araya/templates"
    When I run "node <CLI_DIST>/cli.js validate --adapter mock" with the working directory at the environment root
    Then the command exits with code 0
    And the standard output contains "Validation successful"
