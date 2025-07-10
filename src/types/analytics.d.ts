import { ObjectId } from "mongodb";

export interface Analytics {
    _id?: ObjectId
    link_id: string;
    account_id: string;
    ip_address: string;
    user_agent: string;
    platform: string;
    browser: string;
    version: string;
    language: string;
    referrer: string;
    timestamp: Date;
    remote_port: string;
    accept: string;
    accept_language: string;
    accept_encoding: string;
    country: string;
    ip_data: IPAddress;
    ip_version: string;
}

export interface IPAddress {
    ip_address: string;
    ip_version: string;
    isp: string;
    country: string;
    timestamp: Date;
}