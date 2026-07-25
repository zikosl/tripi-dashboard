import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

export type LocalUploadArea =
  | 'avatars'
  | 'organizers'
  | 'trip-images'
  | 'payment-proofs';

export type StoredFile = {
  key: string;
  absolutePath: string;
  publicUrl: string | null;
};

@Injectable()
export class LocalStorageService {
  private readonly root = resolve(
    process.cwd(),
    process.env.LOCAL_STORAGE_PATH ?? './uploads',
  );

  async save(
    area: LocalUploadArea,
    originalName: string,
    contents: Buffer,
    isPrivate = area === 'payment-proofs',
  ): Promise<StoredFile> {
    const fileName = `${randomUUID()}${extname(originalName).toLowerCase()}`;
    const visibility = isPrivate ? 'private' : 'public';
    const directory = join(this.root, visibility, area);
    await mkdir(directory, { recursive: true });
    const absolutePath = join(directory, fileName);
    await writeFile(absolutePath, contents, { flag: 'wx', mode: 0o640 });
    const key = `${visibility}/${area}/${fileName}`;
    const publicBase = (
      process.env.LOCAL_STORAGE_PUBLIC_URL ??
      'http://localhost:4000/uploads'
    ).replace(/\/$/, '');
    return {
      key,
      absolutePath,
      publicUrl: isPrivate ? null : `${publicBase}/${area}/${fileName}`,
    };
  }

  async remove(key: string): Promise<void> {
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}/`)) {
      throw new Error('Invalid local storage key.');
    }
    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}
