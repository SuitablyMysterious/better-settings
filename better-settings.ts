/**
 * Better Settings – adds new blocks to the existing Settings palette.
 */
namespace settings {
    // ------------- internal alias to silence type-errors -------------
    const S = settings as any;   // use S.writeString(), S.exists(), …

    /* ───── 1. TILEMAP ───────────────────────────────────────── */

    //% block="set setting $name to tilemap $map"
    //% blockId=bs_write_tilemap
    //% group="Arrays" name.shadow=text
    export function writeTilemap(name: string, map: tiles.TileMapData): void {
        const buf = (map as any).data as Buffer;
        if (buf) S.writeString(name, buf.toHex());
    }

    //% block="read setting $name as tilemap using tileset $tileset=variables_get(myTileset)||array"
    //% blockId=bs_read_tilemap
    //% group="Arrays" name.shadow=text handlerReturns=tilemap
    export function readTilemap(
        name: string,
        tileset: Image[],
        scale: TileScale = TileScale.Sixteen
    ): tiles.TileMapData {
        if (!S.exists(name)) return null;
        const buf = Buffer.fromHex(S.readString(name));
        const w = buf.getNumber(NumberFormat.UInt16LE, 0);
        const h = buf.getNumber(NumberFormat.UInt16LE, 2);
        return tiles.createTilemap(buf, image.create(w, h), tileset, scale);
    }

    /* ───── 2. STRING ARRAY ──────────────────────────────────── */

    //% block="set setting $name to string array $arr"
    //% blockId=bs_write_str_array
    //% group="Arrays" name.shadow=text arr.shadow=lists_create_with
    export function writeStringArray(name: string, arr: string[]): void {
        S.writeString(name, JSON.stringify(arr || []));
    }

    //% block="read setting $name as string array"
    //% blockId=bs_read_str_array
    //% group="Arrays" name.shadow=text handlerReturns=Array
    export function readStringArray(name: string): string[] {
        return S.exists(name) ? JSON.parse(S.readString(name)) : [];
    }

    /* ───── 3. BOOLEAN ARRAY (bit-packed) ────────────────────── */

    //% block="set setting $name to boolean array $arr"
    //% blockId=bs_write_bool_array
    //% group="Arrays" name.shadow=text arr.shadow=lists_create_with
    export function writeBooleanArray(name: string, arr: boolean[]): void {
        const len = arr ? arr.length : 0;
        const buf = control.createBuffer(1 + Math.ceil(len / 8));
        buf.setNumber(NumberFormat.UInt16LE, 0, len);
        for (let i = 0; i < len; i++) {
            const byte = 1 + (i >> 3);
            if (arr[i]) buf[byte] |= 1 << (i & 7);
        }
        S.writeString(name, buf.toHex());
    }

    //% block="read setting $name as boolean array"
    //% blockId=bs_read_bool_array
    //% group="Arrays" name.shadow=text handlerReturns=Array
    export function readBooleanArray(name: string): boolean[] {
        if (!S.exists(name)) return [];
        const buf = Buffer.fromHex(S.readString(name));
        const len = buf.getNumber(NumberFormat.UInt16LE, 0);
        const out: boolean[] = [];
        for (let i = 0; i < len; i++) {
            const byte = 1 + (i >> 3);
            out.push((buf[byte] & (1 << (i & 7))) !== 0);
        }
        return out;
    }

    /* ───── 4. READ-OR-DEFAULT HELPERS ───────────────────────── */

    //% block="read number setting $name or default $def"
    //% blockId=bs_num_default
    //% group="Operations" name.shadow=text
    export function readNumberOrDefault(name: string, def: number): number {
        return S.exists(name) ? S.readNumber(name) : def;
    }

    //% block="read string setting $name or default $def"
    //% blockId=bs_str_default
    //% group="Operations" name.shadow=text def.shadow=text
    export function readStringOrDefault(name: string, def: string): string {
        return S.exists(name) ? S.readString(name) : def;
    }

    /* ───── 5. DIAGNOSTICS ───────────────────────────────────── */

    //% block="storage used (bytes)"
    //% blockId=bs_storage_used
    //% group="Operations"
    export function storageUsed(): number {
        let total = 0;
        for (const k of S.list("")) total += S.readString(k).length;
        return total;
    }

    //% block="array of settings names with prefix $prefix"
    //% blockId=bs_list_keys
    //% group="Operations" prefix.shadow=text handlerReturns=Array
    export function listKeys(prefix: string): string[] {
        return S.list(prefix);
    }
}
