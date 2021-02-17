import React, { CSSProperties } from "react";
import { Pagination } from "react-bootstrap";

export function Paginator({className, style, page, pageCount, onPageChange}: {
    className?: string;
    style?: CSSProperties;

    page?: number | null;
    pageCount?: number | null;

    onPageChange?: (page: number) => void;
}) {
    const paginationPages = [];
    const currentPage = page || 1;
    const startingPage = Math.max(currentPage - 10, 1);
    const endingPage = Math.min(currentPage + 10, pageCount || 1);
    for (let i = startingPage; i <= endingPage; i++) {
        paginationPages.push(i);
    }

    const handlePageChange = (page: number) => () => {
        if (onPageChange) {
            onPageChange(page);
        }
    };

    return <Pagination className={className} style={style}>
        <Pagination.First onClick={handlePageChange(1)} />
        <Pagination.Prev onClick={handlePageChange(Math.max(currentPage - 1, 1))} />
        {paginationPages.length && !paginationPages[0] && <Pagination.Ellipsis disabled />}
        {paginationPages.map(i => <Pagination.Item key={i} active={currentPage === i} disabled={currentPage === i} onClick={handlePageChange(i)}>{i}</Pagination.Item>)}
        {paginationPages.length && paginationPages[paginationPages.length - 1] !== (pageCount || 1) && <Pagination.Ellipsis disabled />}
        <Pagination.Next onClick={handlePageChange(Math.min(currentPage + 1, pageCount || 1))} />
        <Pagination.Last onClick={handlePageChange(pageCount || 1)} />
    </Pagination>
}
