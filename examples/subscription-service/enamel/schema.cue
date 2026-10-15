package subscription

import "list"

// Rules evaluate the database observation as data. They do not unify it with a
// second, exhaustive schema: new tables, columns and constraints remain free.
schema: {
	program:  programSchema
	database: databaseSchema

	checks: {
		// Every column required by the program must be observed in its table.
		columns: {
			for table, requirement in programSchema.tables {
				for column, _ in requirement.columns {
					"\(table).\(column)": list.Contains(databaseSchema.tables[table].columns, column) & true
				}
			}
		}

		// Every required persisted constraint must be observed.
		constraints: {
			for constraint, _ in programSchema.constraints {
				"\(constraint)": list.Contains(databaseSchema.constraints, constraint) & true
			}
		}

		// Runtime statuses and the PostgreSQL enum must match exactly.
		statuses: {
			for status, _ in programSchema.enums.subscription_status.values {
				"required-\(status)": list.Contains(databaseSchema.enums.subscription_status.values, status) & true
			}
			for status in databaseSchema.enums.subscription_status.values {
				"known-\(status)": programSchema.enums.subscription_status.values[status] == true
			}
		}

		// This is a structural convention, independent of the program projection:
		// it also covers a newly added table that application code does not use yet.
		creationTimestamps: {
			for table, observation in databaseSchema.tables {
				"\(table)": list.Contains(observation.columns, "created_at") & true
			}
		}
	}
}
