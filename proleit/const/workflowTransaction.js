'use strict';

export const DefaultSourceLink =
`var bpmnPrefix = "BPMN";
var elementName = execution.getBpmnModelElementInstance().getName();
var processName = execution.getProcessDefinition().name;
var processInstanceId = String(execution.getId());
var sourceLink = bpmnPrefix + "_" + processInstanceId + "_" + processName.substring(0, 75) + "_" + elementName.substring(0, 75);
`;

export const DefaultWorkflowTransaction = {
  jobParameters: [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  sPassword: null,
  tJob: 0,
  useClientJobTime: true,
  sTransactionLink: '',
  nCode: 1,
  sSourceSystem: null,
  sSourceLink: "[BPMN_ProcessName_ProcessInstanceID_ElementName]",
  sUser: "[System]",
  nLanguageCode: 0,
  sInfo: "",
  sURL: null
};

export const SchemaWorkflowTransaction = {
  type:  "object",
  properties: {
    jobParameters: { type: "array", items: { type: "string" } },
    sPassword: { type: "string" },
    tJob: { type: "integer" },
    useClientJobTime: { type: "boolean" },
    sTransactionLink: { type: "string" },
    nCode: { type: "integer" },
    sSourceSystem: { type: "string" },
    sSourceLink: { type: "string" },
    sUser: { type: "string" },
    nLanguageCode: { type: "integer" },
    sInfo: { type: "string" },
    sURL: { type: "string" }
 },
}