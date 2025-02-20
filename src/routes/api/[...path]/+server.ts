import type { RequestHandler } from '@sveltejs/kit';
import { handleRequest } from '../../../server';

export const GET: RequestHandler = ({ request }) => {
	return handleRequest(request);
};

export const POST: RequestHandler = ({ request }) => {
	return handleRequest(request);
};
