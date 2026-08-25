import { NextRequest, NextResponse } from 'next/server';
import { GoogleMerchantCenterService } from '@shoppage/kernel';

export async function GET(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  const merchantId = params.merchantId;
  const baseUrl = request.nextUrl.origin || 'https://shoppage.co.za';

  const xml = GoogleMerchantCenterService.generateGoogleShoppingFeedXml(merchantId, baseUrl);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
