import { NextResponse } from "next/server"
import { storage } from "../../_lib/storage"

export async function GET() {
  try {
    // Ensure storage is seeded
    await storage.ensureSeeded()
    
    // Get some sample data using public methods
    const allUsers = await storage.searchUsers("", "")
    const users = allUsers.slice(0, 3)
    
    // For now, we'll create sample data since we don't have public methods for other types
    const sampleOperators = [
      { id: "op_1", companyName: "City Bus Lines", phone: "+263712345678" },
      { id: "op_2", companyName: "ZUPCO Transport", phone: "+263775432109" },
      { id: "op_3", companyName: "Harare Kombis", phone: "+263787654321" }
    ]
    
    const sampleMerchants = [
      { id: "merchant_1", businessName: "Pick n Pay Harare", phone: "+263711111111" },
      { id: "merchant_2", businessName: "ZESA Harare", phone: "+263722222222" },
      { id: "merchant_3", businessName: "City of Harare", phone: "+263733333333" }
    ]
    
    const sampleAdmins = [
      { id: "admin_1", fullName: "System Administrator", phone: "+263700000001" },
      { id: "admin_2", fullName: "Platform Manager", phone: "+263700000002" }
    ]
    
    const samplePartners = [
      { id: "partner_1", businessName: "EcoCash", phone: "+263744444444" },
      { id: "partner_2", businessName: "CBZ Bank", phone: "+263755555555" },
      { id: "partner_3", businessName: "OneMoney", phone: "+263766666666" }
    ]
    
    return NextResponse.json({
      success: true,
      storage: {
        users: users.length,
        operators: sampleOperators.length,
        merchants: sampleMerchants.length,
        admins: sampleAdmins.length,
        partners: samplePartners.length,
        sampleUsers: users.map(u => ({ id: u.id, fullName: u.fullName, phone: u.phone, pinHash: u.pin.substring(0, 20) + "..." })),
        sampleOperators: sampleOperators.map(o => ({ id: o.id, companyName: o.companyName, phone: o.phone })),
        sampleMerchants: sampleMerchants.map(m => ({ id: m.id, businessName: m.businessName, phone: m.phone })),
        sampleAdmins: sampleAdmins.map(a => ({ id: a.id, fullName: a.fullName, phone: a.phone })),
        samplePartners: samplePartners.map(p => ({ id: p.id, businessName: p.businessName, phone: p.phone })),
      }
    })
  } catch (error) {
    console.error("Storage test error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}