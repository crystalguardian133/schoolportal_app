import { router, usePage } from '@inertiajs/react';
import { useCallback } from 'react';

type Options = {
    baseUrl: string;
    paramName: string;
    only: string[];
    extraParams?: Record<string, string | number | undefined>;
};

export function usePrefetchedPagination(options: Options) {
    const { baseUrl, paramName, only, extraParams } = options;
    const { props } = usePage();
    const usersPagination = (props as any).usersPagination ?? { current_page: 1, last_page: 1, total: 0 };

    const buildParams = useCallback(
        (page: number) => {
            const params: Record<string, string | number> = { [paramName]: page };
            if (extraParams) {
                for (const [key, val] of Object.entries(extraParams)) {
                    if (val !== undefined && val !== '') {
                        params[key] = val;
                    }
                }
            }
            return params;
        },
        [paramName, extraParams],
    );

    const goToPage = useCallback(
        (page: number) => {
            if (page < 1 || page > usersPagination.last_page) return;

            router.get(
                baseUrl,
                buildParams(page),
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                    showProgress: false,
                    only,
                },
            );
        },
        [baseUrl, buildParams, only, usersPagination.last_page],
    );

    return {
        currentPage: usersPagination.current_page,
        lastPage: usersPagination.last_page,
        total: usersPagination.total,
        goToPage,
        hasNext: usersPagination.current_page < usersPagination.last_page,
        hasPrev: usersPagination.current_page > 1,
    };
}
