# Invenzaa Data Dictionary

## Medicine

| Field                | Type     | Required | Default | Description                                |
| -------------------- | -------- | -------- | ------- | ------------------------------------------ |
| \_id                 | ObjectId | auto     | -       | Primary key                                |
| name                 | String   | yes      | -       | Medicine trade/brand name                  |
| genericName          | String   | no       | ''      | Generic/scientific name                    |
| description          | String   | no       | ''      | Description or notes                       |
| category             | String   | no       | ''      | Category (e.g. Antibiotic, Analgesic)      |
| unit                 | String   | no       | 'pcs'   | Unit of measure (pcs, strips, bottles, ml) |
| minStockLevel        | Number   | no       | 10      | Minimum stock threshold for alerts         |
| manufacturer         | String   | no       | ''      | Manufacturer name                          |
| prescriptionRequired | Boolean  | no       | false   | Requires prescription                      |
| organization         | ObjectId | yes      | -       | FK to Organization                         |
| createdAt            | Date     | auto     | -       | Created timestamp                          |
| updatedAt            | Date     | auto     | -       | Updated timestamp                          |

## Batch

| Field           | Type     | Required | Default | Description               |
| --------------- | -------- | -------- | ------- | ------------------------- |
| \_id            | ObjectId | auto     | -       | Primary key               |
| batchNo         | String   | yes      | -       | Unique per organization   |
| medicine        | ObjectId | yes      | -       | FK to Medicine            |
| quantity        | Number   | yes      | -       | Current quantity (≥ 0)    |
| manufactureDate | Date     | yes      | -       | Date of manufacture       |
| expiryDate      | Date     | yes      | -       | Must be > manufactureDate |
| organization    | ObjectId | yes      | -       | FK to Organization        |
| createdAt       | Date     | auto     | -       | Created timestamp         |
| updatedAt       | Date     | auto     | -       | Updated timestamp         |
