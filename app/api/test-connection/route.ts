import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { engine } = data

    if (!engine) {
      return NextResponse.json(
        { success: false, message: '❌ Nieznany silnik' }
      )
    }

    // Symuluj test połączenia
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: `✅ Silnik ${engine} działa!\n\nTest połączenia zakończony sukcesem.`
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '❌ Błąd serwera' },
      { status: 500 }
    )
  }
}