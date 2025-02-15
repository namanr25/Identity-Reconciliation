# Identity Reconciliation API

This is an API for managing customer contact records. It merges customer contact records when a new contact matches existing clusters by common email or phone. If two different clusters are found, they are unified under the oldest primary ID.

## 🚀 Live Deployment
The API is deployed on **Render**.

### **📌 Base URL**
🔗 [https://identity-reconciliation-2-d7el.onrender.com](https://identity-reconciliation-2-d7el.onrender.com)

### **📌 Endpoints**
#### **1️⃣ Identify Contact**
- **URL:** `POST /identify`
- **Description:** Finds or merges contact records based on email and phone number.
- **Request Body (JSON)**
  ```json
  {
    "email": "test@example.com",
    "phoneNumber": "1234567890"
  }

