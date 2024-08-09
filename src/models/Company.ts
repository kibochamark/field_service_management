/**
 * Company schema
 */
import mongoose from "mongoose";


const CompanySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter company name"]

        }
    },
    {
        timestamps: true
    }
)

const Company = new mongoose.Model("Company", CompanySchema)

export default Company