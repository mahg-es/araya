*** Settings ***
Documentation     API-contract certification for the ArayaExecutionAdapter published
...               interface (ADR-0012 §3.3). Certifies that the observed surface still
...               honors the version-pinned promised surface — no public-contract break.
Library           Process

*** Variables ***
# Supplied by the API-contract adapter via `robot --variable`:
#   ${CLI_DIST}         absolute path to the dir containing the compiled harness
#   ${BOUNDARY}         the logical published-interface boundary id
#   ${MANIFEST}         absolute path to the boundary manifest
#   ${OBSERVED_SOURCE}  absolute source to observe (or "" for the declared source)

*** Test Cases ***
Published Interface Honors Its Promised Surface
    [Documentation]    The observed surface must match the version-pinned promised
    ...                surface; a breaking change makes the harness exit non-zero.
    ${result}=    Run Process    node    ${CLI_DIST}${/}araya/v2/contract/interface-contract-check.js
    ...    ${BOUNDARY}    ${MANIFEST}    ${OBSERVED_SOURCE}    stderr=STDOUT
    Should Be Equal As Integers    ${result.rc}    0
    Should Contain    ${result.stdout}    no breaking change
