import { submitCabEnquiry } from "@/features/cabs/server/submit-cab-enquiry";
import { handleEnquiryRequest } from "@/features/enquiry/server/http";

/** Cab booking form. */
export async function POST(request: Request): Promise<Response> {
  return handleEnquiryRequest(request, submitCabEnquiry);
}
