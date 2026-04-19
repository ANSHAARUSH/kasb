import { proxyKycGenerateOTP, proxyKycVerifyOTP } from './aiProxy'

export const kycService = {
    /**
     * Generates an Aadhaar OTP session
     * @param aadhaarNumber 12-digit Aadhaar number
     * @returns client_id for the verification session
     */
    async generateOTP(aadhaarNumber: string) {
        const result = await proxyKycGenerateOTP(aadhaarNumber)
        return result.client_id
    },

    /**
     * Verifies the Aadhaar OTP
     * @param clientId reference ID from generateOTP
     * @param otp 6-digit OTP
     * @returns Verified user metadata
     */
    async verifyOTP(clientId: string, otp: string) {
        const result = await proxyKycVerifyOTP(clientId, otp)
        return {
            full_name: result.full_name,
            dob: result.dob,
            gender: result.gender,
            address: result.address,
            raw: result
        }
    }
}
