export interface MingoFileInterface {
    filename: string;
    content_type: string;
    created_at: Date;
    updated_at: Date;
    size: number;
    metadata: any;
    md5: string;
}
