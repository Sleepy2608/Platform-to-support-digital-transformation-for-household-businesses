/**
 * Financial Template Management — Admin UI JavaScript
 * jQuery-based AJAX client for the Spring Boot REST API.
 *
 * Endpoints consumed:
 *   GET    /api/admin/templates
 *   GET    /api/admin/templates/{id}
 *   POST   /api/admin/templates
 *   PUT    /api/admin/templates/{id}
 *   PATCH  /api/admin/templates/{id}/status
 */
$(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════
    // Configuration
    // ═══════════════════════════════════════════════════════════════════
    const API_BASE = '/api/admin/templates';
    const PAGE_SIZE = 10;

    // ── State ──
    let currentPage = 0;
    let totalPages = 0;
    let searchTimer = null;

    // ── Type label map ──
    const TYPE_LABELS = {
        REVENUE_LEDGER: 'Sổ doanh thu',
        EXPENSE_LEDGER: 'Sổ chi phí',
        DEBT_REPORT: 'Báo cáo công nợ',
        CASH_FLOW: 'Lưu chuyển tiền tệ',
        TAX_SUMMARY: 'Tổng hợp thuế',
        BALANCE_SHEET: 'Bảng cân đối'
    };

    // ═══════════════════════════════════════════════════════════════════
    // Initial Load
    // ═══════════════════════════════════════════════════════════════════
    loadTemplates();

    // ═══════════════════════════════════════════════════════════════════
    // Event Bindings
    // ═══════════════════════════════════════════════════════════════════

    // Search — debounced 400ms
    $('#searchInput').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            currentPage = 0;
            loadTemplates();
        }, 400);
    });

    // Filters
    $('#filterType, #filterStatus').on('change', function () {
        currentPage = 0;
        loadTemplates();
    });

    // Pagination
    $('#btnPrev').on('click', function () {
        if (currentPage > 0) { currentPage--; loadTemplates(); }
    });
    $('#btnNext').on('click', function () {
        if (currentPage < totalPages - 1) { currentPage++; loadTemplates(); }
    });

    // Create button → open modal
    $('#btnCreate').on('click', function () {
        openCreateModal();
    });

    // Modal close handlers
    $('#btnCloseModal, #btnCancelModal').on('click', closeModal);
    $('#btnCloseVersionModal').on('click', closeVersionModal);

    // Click outside modal to close
    $('#templateModal').on('click', function (e) {
        if (e.target === this) closeModal();
    });
    $('#versionModal').on('click', function (e) {
        if (e.target === this) closeVersionModal();
    });

    // ESC key to close modals
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
            closeVersionModal();
        }
    });

    // Form submit
    $('#templateForm').on('submit', function (e) {
        e.preventDefault();
        submitTemplate();
    });

    // JSON helpers
    $('#btnFormatJson').on('click', formatJsonEditor);
    $('#btnSampleJson').on('click', insertSampleJson);

    // ═══════════════════════════════════════════════════════════════════
    // API Calls
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Loads the template list with current filters and pagination.
     */
    function loadTemplates() {
        showLoading(true);
        var params = {
            page: currentPage,
            size: PAGE_SIZE
        };
        var type = $('#filterType').val();
        var status = $('#filterStatus').val();
        var search = $('#searchInput').val().trim();

        if (type) params.type = type;
        if (status) params.status = status;
        if (search) params.search = search;

        $.ajax({
            url: API_BASE,
            method: 'GET',
            data: params,
            headers: getAuthHeaders(),
            success: function (res) {
                showLoading(false);
                if (res.success && res.data) {
                    renderTable(res.data.content);
                    updatePagination(res.data);
                }
            },
            error: function (xhr) {
                showLoading(false);
                handleError(xhr, 'Lỗi tải danh sách mẫu báo cáo');
            }
        });
    }

    /**
     * Creates or updates a template.
     */
    function submitTemplate() {
        var editId = $('#editTemplateId').val();
        var isEdit = !!editId;

        // Validate JSON
        var configText = $('#inputConfig').val().trim();
        var configJson;
        try {
            configJson = JSON.parse(configText);
            $('#jsonError').text('');
        } catch (e) {
            $('#jsonError').text('JSON không hợp lệ: ' + e.message);
            return;
        }

        var payload;
        if (isEdit) {
            payload = {
                name: $('#inputName').val().trim(),
                officialFormCode: $('#inputFormCode').val().trim() || null,
                legalBasis: $('#inputLegalBasis').val().trim() || null,
                description: $('#inputDescription').val().trim() || null,
                configurationJson: configJson
            };
        } else {
            payload = {
                name: $('#inputName').val().trim(),
                templateCode: $('#inputCode').val().trim(),
                type: $('#inputType').val(),
                officialFormCode: $('#inputFormCode').val().trim() || null,
                legalBasis: $('#inputLegalBasis').val().trim() || null,
                description: $('#inputDescription').val().trim() || null,
                configurationJson: configJson
            };
        }

        setSubmitting(true);

        $.ajax({
            url: isEdit ? API_BASE + '/' + editId : API_BASE,
            method: isEdit ? 'PUT' : 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: getAuthHeaders(),
            success: function (res) {
                setSubmitting(false);
                if (res.success) {
                    showToast(res.message || (isEdit ? 'Cập nhật thành công' : 'Tạo mẫu thành công'), 'success');
                    closeModal();
                    loadTemplates();
                }
            },
            error: function (xhr) {
                setSubmitting(false);
                handleError(xhr, isEdit ? 'Lỗi cập nhật mẫu' : 'Lỗi tạo mẫu');
            }
        });
    }

    /**
     * Toggles the template status (ACTIVE ↔ INACTIVE).
     */
    function toggleStatus(id, currentStatus) {
        var newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        var confirmMsg = newStatus === 'INACTIVE'
            ? 'Ngừng hoạt động mẫu này? Mẫu sẽ không thể dùng để tạo báo cáo mới.'
            : 'Kích hoạt lại mẫu này?';

        if (!confirm(confirmMsg)) return;

        $.ajax({
            url: API_BASE + '/' + id + '/status',
            method: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({ status: newStatus }),
            headers: getAuthHeaders(),
            success: function (res) {
                if (res.success) {
                    showToast(res.message || 'Cập nhật trạng thái thành công', 'success');
                    loadTemplates();
                }
            },
            error: function (xhr) {
                handleError(xhr, 'Lỗi cập nhật trạng thái');
            }
        });
    }

    /**
     * Opens the edit modal pre-filled with template data.
     */
    function openEditModal(id) {
        $.ajax({
            url: API_BASE + '/' + id,
            method: 'GET',
            headers: getAuthHeaders(),
            success: function (res) {
                if (res.success && res.data) {
                    var t = res.data;
                    $('#modalTitle').text('Chỉnh sửa mẫu báo cáo');
                    $('#editTemplateId').val(t.id);
                    $('#inputName').val(t.templateName);
                    $('#inputCode').val(t.templateCode).prop('disabled', true);
                    $('#inputType').val(t.templateType).prop('disabled', true);
                    $('#inputFormCode').val(t.officialFormCode || '');
                    $('#inputLegalBasis').val(t.legalBasis || '');
                    $('#inputDescription').val(t.description || '');
                    $('#inputConfig').val(
                        t.currentConfigurationJson
                            ? JSON.stringify(t.currentConfigurationJson, null, 2)
                            : ''
                    );
                    $('#jsonError').text('');
                    $('#btnSubmit .btn-text').text('Cập nhật');
                    $('#templateModal').fadeIn(200);
                }
            },
            error: function (xhr) {
                handleError(xhr, 'Lỗi tải chi tiết mẫu');
            }
        });
    }

    /**
     * Opens the version history modal.
     */
    function openVersionHistory(id) {
        $.ajax({
            url: API_BASE + '/' + id,
            method: 'GET',
            headers: getAuthHeaders(),
            success: function (res) {
                if (res.success && res.data) {
                    var t = res.data;
                    $('#versionModalTitle').text('Lịch sử phiên bản — ' + t.templateName);
                    renderVersionHistory(t.versionHistory || [], t.currentVersionId);
                    $('#versionModal').fadeIn(200);
                }
            },
            error: function (xhr) {
                handleError(xhr, 'Lỗi tải lịch sử phiên bản');
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // Rendering
    // ═══════════════════════════════════════════════════════════════════

    function renderTable(templates) {
        var $tbody = $('#templateTableBody');
        $tbody.empty();

        if (!templates || templates.length === 0) {
            $('table').hide();
            $('#emptyState').show();
            return;
        }

        $('table').show();
        $('#emptyState').hide();

        templates.forEach(function (t) {
            var statusClass = t.status === 'ACTIVE' ? 'status-active' : 'status-inactive';
            var statusLabel = t.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng';
            var toggleBtnClass = t.status === 'ACTIVE' ? 'toggle-active' : 'toggle-inactive';
            var toggleTitle = t.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt';

            var row = '<tr>' +
                '<td><span class="template-code">' + escapeHtml(t.templateCode) + '</span></td>' +
                '<td><span class="template-name" title="' + escapeHtml(t.templateName) + '">' + escapeHtml(t.templateName) + '</span></td>' +
                '<td><span class="type-badge">' + (TYPE_LABELS[t.templateType] || t.templateType) + '</span></td>' +
                '<td><span class="version-badge">v' + (t.currentVersionNumber || 1) + '</span></td>' +
                '<td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
                '<td>' + formatDateTime(t.updatedAt) + '</td>' +
                '<td>' +
                    '<div class="action-group">' +
                        '<button class="action-btn" title="Chỉnh sửa" onclick="window._editTemplate(' + t.id + ')">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                        '</button>' +
                        '<button class="action-btn" title="Lịch sử phiên bản" onclick="window._viewHistory(' + t.id + ')">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                        '</button>' +
                        '<button class="action-btn ' + toggleBtnClass + '" title="' + toggleTitle + '" onclick="window._toggleStatus(' + t.id + ', \'' + t.status + '\')">' +
                            (t.status === 'ACTIVE'
                                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
                                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
                            ) +
                        '</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
            $tbody.append(row);
        });
    }

    function renderVersionHistory(versions, currentVersionId) {
        var $list = $('#versionList');
        $list.empty();

        if (!versions || versions.length === 0) {
            $list.html('<p style="text-align:center;color:var(--text-muted);padding:30px;">Chưa có phiên bản nào.</p>');
            return;
        }

        versions.forEach(function (v) {
            var isCurrent = v.id === currentVersionId;
            var card = '<div class="version-card">' +
                '<div class="version-card-header">' +
                    '<div>' +
                        '<span class="version-badge">v' + v.versionNumber + '</span>' +
                        (isCurrent ? ' <span class="status-badge status-active" style="margin-left:8px;">Hiện tại</span>' : '') +
                        (v.status === 'SUPERSEDED' ? ' <span class="status-badge status-inactive" style="margin-left:8px;">Đã thay thế</span>' : '') +
                    '</div>' +
                    '<div class="version-meta">' +
                        '<span>Hiệu lực: ' + (v.effectiveFrom || '—') + (v.effectiveTo ? ' → ' + v.effectiveTo : '') + '</span>' +
                        '<span>Tạo lúc: ' + formatDateTime(v.createdAt) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="version-config">' +
                    '<pre>' + escapeHtml(JSON.stringify(v.configurationJson, null, 2)) + '</pre>' +
                '</div>' +
            '</div>';
            $list.append(card);
        });
    }

    function updatePagination(pageData) {
        totalPages = pageData.totalPages || 1;
        $('#pageInfo').text('Trang ' + (currentPage + 1) + ' / ' + totalPages +
            ' (' + pageData.totalElements + ' mẫu)');
        $('#btnPrev').prop('disabled', pageData.first);
        $('#btnNext').prop('disabled', pageData.last);
        $('#pagination').toggle(totalPages > 1);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Modal Helpers
    // ═══════════════════════════════════════════════════════════════════

    function openCreateModal() {
        $('#modalTitle').text('Tạo mẫu báo cáo mới');
        $('#editTemplateId').val('');
        $('#templateForm')[0].reset();
        $('#inputCode').prop('disabled', false);
        $('#inputType').prop('disabled', false);
        $('#jsonError').text('');
        $('#btnSubmit .btn-text').text('Lưu mẫu');
        $('#templateModal').fadeIn(200);
        setTimeout(function () { $('#inputName').focus(); }, 300);
    }

    function closeModal() {
        $('#templateModal').fadeOut(200);
    }

    function closeVersionModal() {
        $('#versionModal').fadeOut(200);
    }

    function setSubmitting(loading) {
        if (loading) {
            $('#btnSubmit').prop('disabled', true);
            $('#btnSubmit .btn-text').hide();
            $('#btnSubmit .btn-loading').show();
        } else {
            $('#btnSubmit').prop('disabled', false);
            $('#btnSubmit .btn-text').show();
            $('#btnSubmit .btn-loading').hide();
        }
    }

    function showLoading(show) {
        if (show) {
            $('#loadingState').show();
            $('table').hide();
            $('#emptyState').hide();
        } else {
            $('#loadingState').hide();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // JSON Editor Helpers
    // ═══════════════════════════════════════════════════════════════════

    function formatJsonEditor() {
        var raw = $('#inputConfig').val().trim();
        if (!raw) return;
        try {
            var parsed = JSON.parse(raw);
            $('#inputConfig').val(JSON.stringify(parsed, null, 2));
            $('#jsonError').text('');
        } catch (e) {
            $('#jsonError').text('JSON không hợp lệ: ' + e.message);
        }
    }

    function insertSampleJson() {
        var sample = {
            title: "Mẫu báo cáo",
            description: "Mô tả mẫu",
            fields: [
                { key: "totalRevenue", label: "Tổng doanh thu", type: "currency" },
                { key: "totalExpense", label: "Tổng chi phí", type: "currency" },
                { key: "netIncome", label: "Lợi nhuận ròng", type: "currency" },
                { key: "period", label: "Kỳ báo cáo", type: "text" }
            ]
        };
        $('#inputConfig').val(JSON.stringify(sample, null, 2));
        $('#jsonError').text('');
    }

    // ═══════════════════════════════════════════════════════════════════
    // Toast Notifications
    // ═══════════════════════════════════════════════════════════════════

    function showToast(message, type) {
        type = type || 'success';
        var icon = type === 'success'
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

        var $toast = $('<div class="toast toast-' + type + '">' + icon + ' ' + escapeHtml(message) + '</div>');
        $('#toastContainer').append($toast);

        setTimeout(function () {
            $toast.addClass('toast-removing');
            setTimeout(function () { $toast.remove(); }, 300);
        }, 4000);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Utilities
    // ═══════════════════════════════════════════════════════════════════

    function getAuthHeaders() {
        // In production, read the JWT from localStorage/cookie.
        var token = localStorage.getItem('token') || '';
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    }

    function handleError(xhr, fallback) {
        var msg = fallback;
        try {
            var body = JSON.parse(xhr.responseText);
            if (body && body.message) msg = body.message;
        } catch (e) { /* use fallback */ }
        showToast(msg, 'error');
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '—';
        try {
            var d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN') + ' ' +
                   d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return dateStr;
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ═══════════════════════════════════════════════════════════════════
    // Global action handlers (called from inline onclick in table rows)
    // ═══════════════════════════════════════════════════════════════════
    window._editTemplate = openEditModal;
    window._viewHistory = openVersionHistory;
    window._toggleStatus = toggleStatus;
});
