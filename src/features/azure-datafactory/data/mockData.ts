import { AdfActivity, AdfPipeline, AdfFactory } from "./AdfData";

export function getMockAdfData(): AdfFactory {
  return new AdfFactory("ukiyo-data-factory", [
    new AdfPipeline("ingest-csv-pipeline", [
      new AdfActivity("Lookup_SourceFiles",     "Lookup"),
      new AdfActivity("ForEach_CsvFile",        "ForEach"),
      new AdfActivity("Copy_CsvToRaw",          "Copy"),
      new AdfActivity("Log_IngestionComplete",  "WebActivity"),
    ]),
    new AdfPipeline("transform-pipeline", [
      new AdfActivity("GetMetadata_RawFiles",   "GetMetadata"),
      new AdfActivity("DF_TransformRawToDwh",   "DataFlow"),
      new AdfActivity("Copy_DwhToMart",         "Copy"),
    ]),
    new AdfPipeline("master-pipeline", [
      new AdfActivity("Set_RunId",              "SetVariable"),
      new AdfActivity("Exec_IngestPipeline",    "ExecutePipeline"),
      new AdfActivity("Check_IngestResult",     "IfCondition"),
      new AdfActivity("Exec_TransformPipeline", "ExecutePipeline"),
      new AdfActivity("Wait_Cooldown",          "Wait"),
    ]),
  ]);
}
