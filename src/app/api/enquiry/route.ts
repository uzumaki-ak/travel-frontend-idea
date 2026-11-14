import { handleEnquiryRequest } from "@/features/enquiry/server/http";
import { submitEnquiry } from "@/features/enquiry/server/submit-enquiry";

/** General and tour query forms. */
export async function POST(request: Request): Promise<Response> {
  return handleEnquiryRequest(request, submitEnquiry);
}
