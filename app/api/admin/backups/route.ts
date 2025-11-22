import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createBackup, deleteBackup, restoreFromBackup, downloadBackup } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, name, description, backupId } = body;

    if (action === 'create') {
      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      const backup = createBackup(
        name,
        description || '',
        session.user.email || 'Unknown',
        'manual'
      );

      return NextResponse.json({
        success: true,
        backup: {
          id: backup.id,
          name: backup.name,
          description: backup.description,
          type: backup.type,
          size: backup.size,
          createdAt: backup.createdAt,
          createdBy: backup.createdBy,
        }
      });
    }

    if (action === 'restore') {
      if (!backupId) {
        return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
      }

      const success = restoreFromBackup(backupId);

      if (!success) {
        return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Backup restored successfully' });
    }

    if (action === 'download') {
      if (!backupId) {
        return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
      }

      const data = downloadBackup(backupId);

      if (!data) {
        return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
      }

      return new NextResponse(data.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup-${backupId}.json"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Backup operation error:', error);
    return NextResponse.json({ error: 'Failed to perform backup operation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const success = deleteBackup(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Backup delete error:', error);
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 });
  }
}
