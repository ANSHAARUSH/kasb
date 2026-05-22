const SUREPASS_BASE_URL = 'https://api.surepass.io'
const API_TOKEN = import.meta.env.VITE_SUREPASS_API_TOKEN

export const kycService = {
    /**
     * Generates an Aadhaar OTP session
     * @param aadhaarNumber 12-digit Aadhaar number
     * @returns client_id for the verification session
     */
    async generateOTP(aadhaarNumber: string) {
        if (!API_TOKEN || API_TOKEN === 'your_surepass_token_here') {
            throw new Error('Surepass API Token is not configured in .env')
        }

        const response = await fetch(`${SUREPASS_BASE_URL}/api/v1/aadhaar-v2/generate-otp`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_number: aadhaarNumber
            })
        })

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.message || 'Surepass: Failed to generate OTP')
        }

        return data.data.client_id
    },

    /**
     * Verifies the Aadhaar OTP
     * @param clientId reference ID from generateOTP
     * @param otp 6-digit OTP
     * @returns Verified user metadata
     */
    async verifyOTP(clientId: string, otp: string) {
        if (!API_TOKEN || API_TOKEN === 'your_surepass_token_here') {
            throw new Error('Surepass API Token is not configured in .env')
        }

        const response = await fetch(`${SUREPASS_BASE_URL}/api/v1/aadhaar-v2/submit-otp`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                otp: otp
            })
        })

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.message || 'Surepass: OTP Verification Failed')
        }

        // Surepass returns full profile data in data.data
        return {
            full_name: data.data.full_name,
            dob: data.data.dob,
            gender: data.data.gender,
            address: data.data.address,
            raw: data.data
        }
    }
}
