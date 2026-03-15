<?php

namespace App\Http\Controllers\Api\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait RespondsWithApi
{
    protected function success(mixed $data = null, array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'meta' => (object) $meta === (object) [] ? (object) [] : $meta,
        ], $status);
    }

    protected function paginated(LengthAwarePaginator $paginator, array $data, array $meta = []): JsonResponse
    {
        return $this->success($data, array_merge($meta, [
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]));
    }

    protected function error(string $message, string $code, int $status): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'code' => $code,
        ], $status);
    }
}
