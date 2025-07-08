// middleware.ts 또는 edge function 파일 최상단에
import { createEdgeConfig } from '@vercel/edge-config'

const edgeConfig = createEdgeConfig({  
  // VERCEL_EDGE_CONFIG binding name
  binding: 'MY_EDGE_CONFIG'  
})

// 요청 시
export default async function middleware(request: NextRequest) {
  const featureFlag = await edgeConfig.get('new-feature-enabled')
  if (featureFlag) {
    // 새로운 기능 처리
  }
  return NextResponse.next()
}
