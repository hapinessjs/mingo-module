export interface MingoFileInterface {
    id?: string | any;
    bucket: string;
    filename: string;
    contentType: string;
    created_at: Date;
    updated_at: Date;
    size: number;
    metadata: any;
    md5: string;
}
