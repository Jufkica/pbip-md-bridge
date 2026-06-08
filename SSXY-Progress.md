### FILE `SSXY-Progress.pbip`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json",
  "version": "1.0",
  "artifacts": [
    {
      "report": {
        "path": "SSXY-Progress.Report"
      }
    }
  ]
}
```

### FILE `SSXY-Progress.Report/definition.pbir`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  "version": "4.0",
  "datasetReference": {
    "byPath": {
      "path": "../SSXY-Progress.SemanticModel"
    }
  }
}
```

### FILE `SSXY-Progress.Report/definition/version.json`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
  "version": "2.0.0"
}
```

### FILE `SSXY-Progress.Report/definition/report.json`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/3.0.0/schema.json",
  "themeCollection": {
    "baseTheme": {
      "name": "CY24SU06",
      "reportVersionAtImport": "5.54",
      "type": "SharedResources"
    }
  },
  "settings": {
    "useStylableVisualContainerHeader": true
  },
  "filterConfig": {
    "filters": []
  }
}
```

### FILE `SSXY-Progress.Report/definition/pages/pages.json`
```text
{
  "pageOrder": [
    "SSXYProgressPage"
  ]
}
```

### FILE `SSXY-Progress.Report/definition/pages/SSXYProgressPage/page.json`
```text
{
  "name": "SSXYProgressPage",
  "displayName": "SSXY Progress",
  "width": 1280,
  "height": 720,
  "displayOption": 2,
  "filters": []
}
```

### FILE `SSXY-Progress.Report/definition/pages/SSXYProgressPage/visuals/CardCompleted/visual.json`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.6.0/schema.json",
  "name": "CardCompleted",
  "position": {
    "x": 20,
    "y": 20,
    "z": 0,
    "width": 200,
    "height": 100
  },
  "visual": {
    "visualType": "card",
    "query": {
      "queryState": {
        "Values": {
          "projections": [
            {
              "field": {
                "Measure": {
                  "Expression": { "SourceRef": { "Entity": "SSXYProgress" } },
                  "Property": "Completed Today"
                }
              },
              "queryRef": "SSXYProgress.Completed Today"
            }
          ]
        }
      }
    },
    "title": { "show": true, "text": "Completed Today" }
  }
}
```

### FILE `SSXY-Progress.Report/definition/pages/SSXYProgressPage/visuals/CardActive/visual.json`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.6.0/schema.json",
  "name": "CardActive",
  "position": {
    "x": 240,
    "y": 20,
    "z": 0,
    "width": 200,
    "height": 100
  },
  "visual": {
    "visualType": "card",
    "query": {
      "queryState": {
        "Values": {
          "projections": [
            {
              "field": {
                "Measure": {
                  "Expression": { "SourceRef": { "Entity": "SSXYProgress" } },
                  "Property": "Active Lots"
                }
              },
              "queryRef": "SSXYProgress.Active Lots"
            }
          ]
        }
      }
    },
    "title": { "show": true, "text": "Active Lots" }
  }
}
```

### FILE `SSXY-Progress.Report/definition/pages/SSXYProgressPage/visuals/CardStacked/visual.json`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.6.0/schema.json",
  "name": "CardStacked",
  "position": {
    "x": 460,
    "y": 20,
    "z": 0,
    "width": 200,
    "height": 100
  },
  "visual": {
    "visualType": "card",
    "query": {
      "queryState": {
        "Values": {
          "projections": [
            {
              "field": {
                "Measure": {
                  "Expression": { "SourceRef": { "Entity": "SSXYProgress" } },
                  "Property": "Stacked Today"
                }
              },
              "queryRef": "SSXYProgress.Stacked Today"
            }
          ]
        }
      }
    },
    "title": { "show": true, "text": "Stacked Today (Op 110)" }
  }
}
```

### FILE `SSXY-Progress.Report/definition/pages/SSXYProgressPage/visuals/CardGlued/visual.json`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.6.0/schema.json",
  "name": "CardGlued",
  "position": {
    "x": 680,
    "y": 20,
    "z": 0,
    "width": 200,
    "height": 100
  },
  "visual": {
    "visualType": "card",
    "query": {
      "queryState": {
        "Values": {
          "projections": [
            {
              "field": {
                "Measure": {
                  "Expression": { "SourceRef": { "Entity": "SSXYProgress" } },
                  "Property": "Glued Today"
                }
              },
              "queryRef": "SSXYProgress.Glued Today"
            }
          ]
        }
      }
    },
    "title": { "show": true, "text": "Glued Today (Op 120)" }
  }
}
```

### FILE `SSXY-Progress.Report/definition/pages/SSXYProgressPage/visuals/MainTable/visual.json`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.6.0/schema.json",
  "name": "MainTable",
  "position": {
    "x": 20,
    "y": 140,
    "z": 0,
    "width": 1240,
    "height": 560
  },
  "visual": {
    "visualType": "tableEx",
    "query": {
      "queryState": {
        "Values": {
          "projections": [
            {
              "field": { "Column": { "Expression": { "SourceRef": { "Entity": "SSXYProgress" } }, "Property": "SerialNumber" } },
              "queryRef": "SSXYProgress.SerialNumber"
            },
            {
              "field": { "Column": { "Expression": { "SourceRef": { "Entity": "SSXYProgress" } }, "Property": "OpSeq" } },
              "queryRef": "SSXYProgress.OpSeq"
            },
            {
              "field": { "Column": { "Expression": { "SourceRef": { "Entity": "SSXYProgress" } }, "Property": "OperationName" } },
              "queryRef": "SSXYProgress.OperationName"
            },
            {
              "field": { "Column": { "Expression": { "SourceRef": { "Entity": "SSXYProgress" } }, "Property": "Status" } },
              "queryRef": "SSXYProgress.Status"
            },
            {
              "field": { "Column": { "Expression": { "SourceRef": { "Entity": "SSXYProgress" } }, "Property": "Operator" } },
              "queryRef": "SSXYProgress.Operator"
            },
            {
              "field": { "Column": { "Expression": { "SourceRef": { "Entity": "SSXYProgress" } }, "Property": "CompletedDate_NL" } },
              "queryRef": "SSXYProgress.CompletedDate_NL"
            },
            {
              "field": { "Column": { "Expression": { "SourceRef": { "Entity": "SSXYProgress" } }, "Property": "CompletedTime_NL" } },
              "queryRef": "SSXYProgress.CompletedTime_NL"
            },
            {
              "field": { "Column": { "Expression": { "SourceRef": { "Entity": "SSXYProgress" } }, "Property": "RouteName" } },
              "queryRef": "SSXYProgress.RouteName"
            }
          ]
        }
      }
    },
    "title": { "show": true, "text": "SSXY Magnet Stack Progress" }
  }
}
```

### FILE `SSXY-Progress.SemanticModel/definition.pbism`
```text
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/semanticModel/definitionProperties/1.0.0/schema.json",
  "version": "4.0",
  "settings": {}
}
```

### FILE `SSXY-Progress.SemanticModel/definition/database.tmdl`
```text
database SSXY-Progress
	compatibilityLevel: 1605
```

### FILE `SSXY-Progress.SemanticModel/definition/model.tmdl`
```text
model Model
	culture: en-US
	defaultPowerBIDataSourceVersion: powerBI_V3

	ref table SSXYProgress

	ref culture en-US
```

### FILE `SSXY-Progress.SemanticModel/definition/cultures/en-US.tmdl`
```text
culture en-US
	linguisticMetadata = "{\"Version\":\"1.0.0\"}"
		contentType: json
```

### FILE `SSXY-Progress.SemanticModel/definition/tables/SSXYProgress.tmdl`
```text
table SSXYProgress

	column SerialNumber
		dataType: string
		sourceColumn: SerialNumber

	column OpSeq
		dataType: int64
		sourceColumn: OpSeq

	column OperationName
		dataType: string
		sourceColumn: OperationName

	column CompletedDate_NL
		dataType: string
		sourceColumn: CompletedDate_NL

	column CompletedTime_NL
		dataType: string
		sourceColumn: CompletedTime_NL

	column CompletedAt_UTC
		dataType: dateTime
		sourceColumn: CompletedAt_UTC

	column Operator
		dataType: string
		sourceColumn: Operator

	column MfgLotID
		dataType: int64
		sourceColumn: MfgLotID

	column RouteID
		dataType: int64
		sourceColumn: RouteID

	column RouteName
		dataType: string
		sourceColumn: RouteName

	column Status
		dataType: string
		sourceColumn: Status

	column SerialSortNum
		dataType: int64
		sourceColumn: SerialSortNum

	column SerialSortType
		dataType: int64
		sourceColumn: SerialSortType

	measure 'Completed Today' = CALCULATE(COUNTROWS(SSXYProgress), SSXYProgress[Status] = "Completed")

	measure 'Active Lots' = CALCULATE(COUNTROWS(SSXYProgress), SSXYProgress[Status] = "Active")

	measure 'Stacked Today' = CALCULATE(COUNTROWS(SSXYProgress), SSXYProgress[Status] = "Completed", SSXYProgress[OpSeq] = 110)

	measure 'Glued Today' = CALCULATE(COUNTROWS(SSXYProgress), SSXYProgress[Status] = "Completed", SSXYProgress[OpSeq] = 120)

	partition SSXYProgress = m
		mode: import
		source =
			let
				BaseUrl  = "https://prod.frencken.nomuda.cloud",
				ApiKey   = "REPLACE_WITH_API_KEY",
				Raw      = Web.Contents(
					BaseUrl,
					[
						RelativePath = "api/public/queries/SSXY-Progress",
						Headers      = [
							Authorization  = "APIKEY " & ApiKey,
							#"Content-Type" = "application/json"
						]
					]
				),
				Json     = Json.Document(Raw),
				Inner    = Json{0},
				Table0   = Table.FromList(Inner, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
				Expanded = Table.ExpandRecordColumn(Table0, "Column1", {
					"SerialNumber", "OpSeq", "OperationName",
					"CompletedDate_NL", "CompletedTime_NL", "CompletedAt_UTC",
					"Operator", "MfgLotID", "RouteID", "RouteName",
					"Status", "SerialSortNum", "SerialSortType"
				}),
				Typed    = Table.TransformColumnTypes(Expanded, {
					{"SerialNumber",      type text},
					{"OpSeq",            type number},
					{"OperationName",    type text},
					{"CompletedDate_NL", type text},
					{"CompletedTime_NL", type text},
					{"CompletedAt_UTC",  type nullable datetime},
					{"Operator",         type text},
					{"MfgLotID",         type number},
					{"RouteID",          type number},
					{"RouteName",        type text},
					{"Status",           type text},
					{"SerialSortNum",    type number},
					{"SerialSortType",   type number}
				})
			in
				Typed
```
