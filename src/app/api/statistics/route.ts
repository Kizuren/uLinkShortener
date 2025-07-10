import { NextResponse } from 'next/server';
import { getAllStats, updateStats } from '@/lib/statisticsdb';

export async function GET() {
  try {
    let stats = await getAllStats();
    
    if (!stats || !stats.last_updated || 
        (new Date().getTime() - new Date(stats.last_updated).getTime() > 5 * 60 * 1000)) { // 5min
      await updateStats();
      stats = await getAllStats();
    }
    
    if (!stats) {
      return NextResponse.json({
        message: "Failed to retrieve statistics",
        success: false,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      message: "Statistics retrieved successfully",
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Statistics retrieval error:', error);
    return NextResponse.json({
      message: "An error occurred while retrieving statistics",
      success: false,
    }, { status: 500 });
  }
}