import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { AttachmentsService } from './attachments.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Task } from './schemas/task.schema';
import { AttachmentValidationPipe } from '../uploads/attachment-validation.pipe';

interface AuthRequest extends Express.Request {
  user?: { id: string; email: string };
}

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private attachmentsService: AttachmentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async list(@Query() query: QueryTasksDto, @Req() req: AuthRequest) {
    return this.tasksService.findAll(req.user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated task statistics for the current user' })
  @ApiResponse({ status: 200, description: 'Task statistics' })
  async stats(@Req() req: AuthRequest) {
    const data = await this.tasksService.getStats(req.user.id);
    return { success: true, data };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created', type: Task })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateTaskDto, @Req() req: AuthRequest) {
    const task = await this.tasksService.create(dto, req.user.id);
    return { success: true, data: task };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Task details', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getOne(@Param('id') id: string, @Req() req: AuthRequest) {
    const task = await this.tasksService.findOne(id, req.user.id);
    return { success: true, data: task };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: AuthRequest,
  ) {
    const task = await this.tasksService.update(id, req.user.id, dto);
    return { success: true, data: task };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 204, description: 'Task deleted' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async delete(@Param('id') id: string, @Req() req: AuthRequest) {
    await this.tasksService.delete(id, req.user.id);
  }

  @Post(':id/attachments')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an attachment to a task' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Attachment created', type: AttachmentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file (type or size)' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 502, description: 'Upload to Cloudinary failed' })
  async uploadAttachment(
    @Param('id') taskId: string,
    @UploadedFile(AttachmentValidationPipe) file: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    const attachment = await this.attachmentsService.create(taskId, req.user.id, file);
    return { success: true, data: attachment };
  }

  @Delete(':id/attachments/:attachmentId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an attachment from a task' })
  @ApiResponse({ status: 204, description: 'Attachment deleted' })
  @ApiResponse({ status: 404, description: 'Task or attachment not found' })
  @ApiResponse({ status: 502, description: 'Cloudinary delete failed' })
  async deleteAttachment(
    @Param('id') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: AuthRequest,
  ) {
    await this.attachmentsService.delete(taskId, req.user.id, attachmentId);
  }
}