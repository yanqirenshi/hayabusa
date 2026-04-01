import {
  SnowflakeDatabase,
  SnowflakeObject,
  SnowflakeObjectGroup,
  SnowflakeSchema,
} from "./SnowflakeData";

export const getMockSnowflakeData = (): SnowflakeDatabase => {
  return new SnowflakeDatabase("Snowflake", [
    new SnowflakeSchema("RAW", [
      new SnowflakeObjectGroup("Table", [
        new SnowflakeObject("ANA_VISA", "Table"),
        new SnowflakeObject("MUFG", "Table"),
        new SnowflakeObject("RAKUTEN", "Table"),
        new SnowflakeObject("SMBC", "Table"),
      ]),
      new SnowflakeObjectGroup("Stage", [
        new SnowflakeObject("ANA_VISA_STAGE", "Stage"),
        new SnowflakeObject("MUFG_STAGE", "Stage"),
        new SnowflakeObject("RAKUTEN_STAGE", "Stage"),
        new SnowflakeObject("SMBC_STAGE", "Stage"),
      ]),
      new SnowflakeObjectGroup("ファイル形式", [
        new SnowflakeObject("CSV_UTF8", "FileFormat"),
        new SnowflakeObject("CSV_UTF8_NO_HEADER", "FileFormat"),
      ]),
    ]),
    new SnowflakeSchema("DWH", [
      new SnowflakeObjectGroup("View", [
        new SnowflakeObject("STG_ANA_VISA", "View"),
        new SnowflakeObject("STG_MUFG", "View"),
        new SnowflakeObject("STG_RAKUTEN", "View"),
        new SnowflakeObject("STG_SMBC", "View"),
      ]),
    ]),
    new SnowflakeSchema("MART", []),
  ]);
};
