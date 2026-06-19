*** Settings ***
Documentation     Certification suite for `araya validate` (AC-001 / REQ-001).
...               GIVEN a compliant ARAYA environment, WHEN `validate` runs,
...               THEN it reports success (stdout contains "Validation successful")
...               and exits with code 0.
Library           Process

*** Variables ***
# Supplied by the gate via `robot --variable`:
#   ${CLI_DIST}    absolute path to the directory containing cli.js
#   ${TARGET_CWD}  absolute path to the working directory (compliant ARAYA root)

*** Test Cases ***
AC-001 Validate Reports Success For Compliant Environment
    [Documentation]    AC-001: GIVEN a compliant ARAYA environment, WHEN `validate`
    ...                runs, THEN it exits 0 and stdout contains "Validation successful".
    ${result}=    Run Process    node    ${CLI_DIST}${/}cli.js    validate    --adapter    mock
    ...    cwd=${TARGET_CWD}    stderr=STDOUT
    Should Be Equal As Integers    ${result.rc}    0
    Should Contain    ${result.stdout}    Validation successful
